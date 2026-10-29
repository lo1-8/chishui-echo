<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { gsap } from 'gsap'
import {
  ArrowDown,
  ArrowUpRight,
  Headphones,
  Map,
  Menu,
  Volume2,
  X
} from 'lucide-vue-next'

/* =====================================================
   一、页面状态
   ===================================================== */

const heroRef = ref(null)
const sceneRef = ref(null)

const farMountainRef = ref(null)
const middleMountainRef = ref(null)
const nearMountainRef = ref(null)
const riverRef = ref(null)
const villageRef = ref(null)
const foregroundRef = ref(null)
const boatRef = ref(null)

const flowFilterRef = ref(null)

const isReady = ref(false)
const isMobileMenuOpen = ref(false)
const showAmbientTip = ref(false)
const ripples = ref([])

let previousX = 0
let previousY = 0
let previousTime = 0
let restoreFlowTimer = null
let hideAmbientTimer = null

let reduceMotion = false
let introTimeline = null

/* =====================================================
   二、首页加载动画
   ===================================================== */

function playIntroAnimation() {
  if (reduceMotion) {
    isReady.value = true
    return
  }

  const hero = heroRef.value
  const scene = sceneRef.value

  if (!hero || !scene) return

  /*
    开场动画逻辑：

    1. 页面整体先出现；
    2. 雾气先出现；
    3. 远山、中景山逐渐显现；
    4. 河流像从山谷中“苏醒”；
    5. 镇子最后从薄雾中显现；
    6. 文案和交互入口出现。

    这里故意避免快速、强烈、夸张的动画，
    让页面更像晨雾逐渐散开。
  */

  gsap.set('.hero-header', {
    opacity: 0,
    y: -12
  })

  gsap.set('.hero-copy', {
    opacity: 0,
    y: 28
  })

  gsap.set('.hero-footer', {
    opacity: 0,
    y: 12
  })

  gsap.set('.scene-mist', {
    opacity: 0
  })

  gsap.set(farMountainRef.value, {
    opacity: 0,
    y: 18
  })

  gsap.set(middleMountainRef.value, {
    opacity: 0,
    y: 22
  })

  gsap.set(nearMountainRef.value, {
    opacity: 0,
    y: 28
  })

  gsap.set(riverRef.value, {
    opacity: 0,
    y: 28,
    scale: 0.96,
    transformOrigin: '50% 75%'
  })

  gsap.set(villageRef.value, {
    opacity: 0,
    y: 22,
    scale: 0.97,
    transformOrigin: '50% 80%'
  })

  gsap.set(boatRef.value, {
    opacity: 0,
    y: 12
  })

  gsap.set(foregroundRef.value, {
    opacity: 0,
    y: 20
  })

  introTimeline = gsap.timeline({
    defaults: {
      ease: 'power3.out'
    },
    onComplete: () => {
      isReady.value = true
    }
  })

  introTimeline
    .to('.hero-header', {
      opacity: 1,
      y: 0,
      duration: 0.9
    })
    .to('.scene-mist', {
      opacity: 1,
      duration: 1.3,
      stagger: 0.12,
      ease: 'sine.out'
    }, '-=0.45')
    .to(farMountainRef.value, {
      opacity: 1,
      y: 0,
      duration: 1.45
    }, '-=0.8')
    .to(middleMountainRef.value, {
      opacity: 1,
      y: 0,
      duration: 1.25
    }, '-=1.0')
    .to(nearMountainRef.value, {
      opacity: 1,
      y: 0,
      duration: 1.15
    }, '-=0.95')
    .to(riverRef.value, {
      opacity: 1,
      y: 0,
      scale: 1,
      duration: 1.45,
      ease: 'power2.out'
    }, '-=0.9')
    .to(villageRef.value, {
      opacity: 1,
      y: 0,
      scale: 1,
      duration: 1.15,
      ease: 'power3.out'
    }, '-=0.85')
    .to(boatRef.value, {
      opacity: 1,
      y: 0,
      duration: 0.75
    }, '-=0.65')
    .to(foregroundRef.value, {
      opacity: 1,
      y: 0,
      duration: 1.1
    }, '-=0.72')
    .to('.hero-copy', {
      opacity: 1,
      y: 0,
      duration: 1.1
    }, '-=1.3')
    .to('.hero-footer', {
      opacity: 1,
      y: 0,
      duration: 0.9
    }, '-=0.65')
}

/* =====================================================
   三、鼠标驱动的克制 3D 景深
   ===================================================== */

function handlePointerMove(event) {
  if (!heroRef.value || !sceneRef.value || reduceMotion) return

  const rect = heroRef.value.getBoundingClientRect()

  const pointerX = event.clientX - rect.left
  const pointerY = event.clientY - rect.top

  /*
    归一化为 -1 到 1：

    鼠标在页面中间时：0
    鼠标在左侧时：-1
    鼠标在右侧时：1
  */
  const normalizedX = (pointerX / rect.width - 0.5) * 2
  const normalizedY = (pointerY / rect.height - 0.5) * 2

  /*
    鼠标柔光位置。
    注意只做非常低透明度的环境光，
    不做明显的“鼠标手电筒”效果。
  */
  heroRef.value.style.setProperty(
    '--pointer-x',
    `${(pointerX / rect.width) * 100}%`
  )

  heroRef.value.style.setProperty(
    '--pointer-y',
    `${(pointerY / rect.height) * 100}%`
  )

  /*
    整体场景像一个极轻微倾斜的地形模型。

    rotateY 最大约 ±2.6deg；
    rotateX 最大约 ±1.7deg。

    这个幅度足以让人感觉有景深，
    但不会像廉价的卡片翻转动画。
  */
  gsap.to(sceneRef.value, {
    rotateY: normalizedX * 2.6,
    rotateX: normalizedY * -1.7,
    x: normalizedX * 4,
    y: normalizedY * 2,
    duration: 0.9,
    ease: 'power3.out',
    overwrite: 'auto'
  })

  /*
    多层景深视差：

    远山移动极少；
    中景稍多；
    镇子与河流最明显；
    前景芦苇、渡船略多一些。

    这是“水墨画卷为主、微缩地形为辅”的关键。
  */
  gsap.to(farMountainRef.value, {
    x: normalizedX * -3,
    y: normalizedY * -1,
    duration: 1.2,
    ease: 'power3.out',
    overwrite: 'auto'
  })

  gsap.to(middleMountainRef.value, {
    x: normalizedX * -7,
    y: normalizedY * -2,
    duration: 1.1,
    ease: 'power3.out',
    overwrite: 'auto'
  })

  gsap.to(nearMountainRef.value, {
    x: normalizedX * -11,
    y: normalizedY * -3,
    duration: 1,
    ease: 'power3.out',
    overwrite: 'auto'
  })

  gsap.to(riverRef.value, {
    x: normalizedX * -12,
    y: normalizedY * -4,
    duration: 0.95,
    ease: 'power3.out',
    overwrite: 'auto'
  })

  gsap.to(villageRef.value, {
    x: normalizedX * -16,
    y: normalizedY * -6,
    duration: 0.9,
    ease: 'power3.out',
    overwrite: 'auto'
  })

  gsap.to(boatRef.value, {
    x: normalizedX * -20,
    y: normalizedY * -7,
    duration: 0.85,
    ease: 'power3.out',
    overwrite: 'auto'
  })

  gsap.to(foregroundRef.value, {
    x: normalizedX * -23,
    y: normalizedY * -8,
    duration: 0.8,
    ease: 'power3.out',
    overwrite: 'auto'
  })

  /*
    流体扰动只作用于“河流”部分。

    不对整个页面和山体使用 displacement filter，
    否则会出现果冻感、画面边缘变形、性能下降。

    这里最大 scale 为 2.4，
    鼠标静止后恢复到 0.45，
    视觉上是河流和空气的细微颤动。
  */
  const now = performance.now()
  const dx = event.clientX - previousX
  const dy = event.clientY - previousY
  const dt = Math.max(now - previousTime, 16)

  const speed = Math.sqrt(dx * dx + dy * dy) / dt
  const flowScale = Math.min(Math.max(speed * 10, 0.45), 2.4)

  if (flowFilterRef.value) {
    flowFilterRef.value.setAttribute(
      'scale',
      flowScale.toFixed(2)
    )
  }

  previousX = event.clientX
  previousY = event.clientY
  previousTime = now

  clearTimeout(restoreFlowTimer)

  restoreFlowTimer = setTimeout(() => {
    if (flowFilterRef.value) {
      gsap.to(flowFilterRef.value, {
        attr: {
          scale: 0.45
        },
        duration: 1.25,
        ease: 'sine.out'
      })
    }
  }, 90)
}

function handlePointerLeave() {
  if (reduceMotion || !sceneRef.value) return

  heroRef.value.style.setProperty('--pointer-x', '72%')
  heroRef.value.style.setProperty('--pointer-y', '34%')

  /*
    鼠标离开后，所有层级缓慢回到初始状态。
  */
  gsap.to(sceneRef.value, {
    rotateX: 0,
    rotateY: 0,
    x: 0,
    y: 0,
    duration: 1.4,
    ease: 'power3.out'
  })

  ;[
    farMountainRef,
    middleMountainRef,
    nearMountainRef,
    riverRef,
    villageRef,
    boatRef,
    foregroundRef
  ].forEach((item) => {
    if (!item.value) return

    gsap.to(item.value, {
      x: 0,
      y: 0,
      duration: 1.4,
      ease: 'power3.out'
    })
  })

  if (flowFilterRef.value) {
    gsap.to(flowFilterRef.value, {
      attr: {
        scale: 0.45
      },
      duration: 1.1,
      ease: 'sine.out'
    })
  }
}

/* =====================================================
   四、点击水波纹
   ===================================================== */

function createRipple(event) {
  if (!heroRef.value || reduceMotion) return

  /*
    点击按钮、链接、菜单时不创建水波纹，
    避免干扰正常交互。
  */
  const interactiveElement = event.target.closest(
    'a, button, input, textarea, select'
  )

  if (interactiveElement) return

  const rect = heroRef.value.getBoundingClientRect()

  const ripple = {
    id: Date.now() + Math.random(),
    x: event.clientX - rect.left,
    y: event.clientY - rect.top
  }

  ripples.value.push(ripple)

  window.setTimeout(() => {
    ripples.value = ripples.value.filter(
      (item) => item.id !== ripple.id
    )
  }, 1800)
}

/* =====================================================
   五、其他交互
   ===================================================== */

function toggleMobileMenu() {
  isMobileMenuOpen.value = !isMobileMenuOpen.value
}

function openAmbientTip() {
  showAmbientTip.value = true

  clearTimeout(hideAmbientTimer)

  hideAmbientTimer = setTimeout(() => {
    showAmbientTip.value = false
  }, 3600)
}

/* =====================================================
   六、生命周期
   ===================================================== */

onMounted(() => {
  reduceMotion = window.matchMedia(
    '(prefers-reduced-motion: reduce)'
  ).matches

  previousTime = performance.now()

  playIntroAnimation()
})

onBeforeUnmount(() => {
  clearTimeout(restoreFlowTimer)
  clearTimeout(hideAmbientTimer)

  if (introTimeline) {
    introTimeline.kill()
  }
})
</script>

<template>
  <main
    ref="heroRef"
    class="home-hero"
    :class="{
      'is-ready': isReady,
      'mobile-menu-open': isMobileMenuOpen
    }"
    @pointermove="handlePointerMove"
    @pointerleave="handlePointerLeave"
    @click="createRipple"
  >
    <!-- =================================================
         全屏环境背景层
         ================================================= -->

    <div class="paper-noise" aria-hidden="true"></div>
    <div class="ambient-light ambient-light-one" aria-hidden="true"></div>
    <div class="ambient-light ambient-light-two" aria-hidden="true"></div>
    <div class="pointer-light" aria-hidden="true"></div>

    <!-- 点击产生的水波纹 -->
    <span
      v-for="ripple in ripples"
      :key="ripple.id"
      class="click-ripple"
      :style="{
        left: `${ripple.x}px`,
        top: `${ripple.y}px`
      }"
      aria-hidden="true"
    ></span>

    <!-- =================================================
         顶部导航
         使用统一容器，修正导航与右侧场景错位问题
         ================================================= -->

    <header class="hero-header">
      <RouterLink
        to="/"
        class="brand"
        aria-label="赤水回声首页"
      >
        <span class="brand-mark">
          <span class="brand-wave brand-wave-one"></span>
          <span class="brand-wave brand-wave-two"></span>
        </span>

        <span class="brand-text">
          <strong>赤水回声</strong>
          <small>CHISHUI ECHOES</small>
        </span>
      </RouterLink>

      <nav class="desktop-nav" aria-label="主导航">
        <RouterLink to="/" class="nav-link active">
          首页
        </RouterLink>

        <RouterLink to="/map" class="nav-link">
          声音地图
        </RouterLink>

        <RouterLink to="/journey" class="nav-link">
          我的旅程
        </RouterLink>

        <RouterLink to="/about" class="nav-link">
          关于项目
        </RouterLink>
      </nav>

      <div class="header-actions">
        <RouterLink to="/map" class="header-map-button">
          <span>进入地图</span>
          <ArrowUpRight :size="16" :stroke-width="1.7" />
        </RouterLink>

        <button
          type="button"
          class="mobile-menu-button"
          :aria-label="isMobileMenuOpen ? '关闭菜单' : '打开菜单'"
          @click.stop="toggleMobileMenu"
        >
          <X
            v-if="isMobileMenuOpen"
            :size="21"
            :stroke-width="1.7"
          />

          <Menu
            v-else
            :size="21"
            :stroke-width="1.7"
          />
        </button>
      </div>
    </header>

    <!-- 移动端菜单 -->
    <transition name="mobile-menu-fade">
      <nav
        v-if="isMobileMenuOpen"
        class="mobile-nav"
        aria-label="移动端导航"
      >
        <RouterLink to="/" @click="isMobileMenuOpen = false">
          首页
        </RouterLink>

        <RouterLink to="/map" @click="isMobileMenuOpen = false">
          声音地图
        </RouterLink>

        <RouterLink to="/journey" @click="isMobileMenuOpen = false">
          我的旅程
        </RouterLink>

        <RouterLink to="/about" @click="isMobileMenuOpen = false">
          关于项目
        </RouterLink>
      </nav>
    </transition>

    <!-- =================================================
         左侧文案区
         ================================================= -->

    <section class="hero-copy">
      <div class="location-label">
        <span class="location-line"></span>
        <span>四川 · 古蔺 · 太平古镇</span>
      </div>

      <h1 class="hero-title">
        <span class="title-prefix">听见</span>
        <span class="title-main">赤水回声</span>
      </h1>

      <p class="hero-subtitle">
        一声船工号子，越过赤水河畔九十年。
      </p>



      <div class="hero-actions">
        <RouterLink to="/map" class="primary-action">
          <span class="primary-action-icon">
            <Map :size="18" :stroke-width="1.65" />
          </span>

          <span class="primary-action-text">
            <strong>开始探索</strong>
          </span>

          <ArrowUpRight
            class="primary-action-arrow"
            :size="19"
            :stroke-width="1.6"
          />
        </RouterLink>

        <button
          type="button"
          class="secondary-action"
          @click.stop="openAmbientTip"
        >
          <span class="secondary-action-icon">
            <Volume2 :size="17" :stroke-width="1.65" />
          </span>

          <span>聆听船工号子</span>
        </button>
      </div>

      <div class="headphone-note">
        <Headphones :size="15" :stroke-width="1.65" />
        <span>建议佩戴耳机，或来10127为您现场献唱。</span>
      </div>

      <transition name="tip-fade">
        <div
          v-if="showAmbientTip"
          class="ambient-tip"
          role="status"
        >
          <span class="tip-dot"></span>
          船工号子音频等待接入。
        </div>
      </transition>
    </section>

    <!-- =================================================
         右侧山河艺术场景
         场景从 Hero 顶部延伸，不再形成独立矩形图片边界
         ================================================= -->

    <section
      ref="sceneRef"
      class="scene-shell"
      aria-label="赤水河与太平古镇艺术场景"
    >
      <!-- 独立雾层 -->
      <div class="scene-mist mist-back"></div>
      <div class="scene-mist mist-middle"></div>
      <div class="scene-mist mist-front"></div>

      <!-- 右上时间标记：保留，但改为更克制的档案感 -->
      <div class="time-mark">
        <span>1935</span>
        <i></i>
        <span>2026</span>
      </div>

      <!-- 山河 SVG -->
      <svg
        class="landscape-svg"
        viewBox="0 0 1280 900"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-label="山峦中缓慢显现的赤水河与太平古镇"
      >
        <defs>
          <!-- 天空和晨雾底色 -->
          <linearGradient
            id="skyGradient"
            x1="640"
            y1="0"
            x2="640"
            y2="900"
            gradientUnits="userSpaceOnUse"
          >
            <stop stop-color="#F4F2E8" />
            <stop offset="0.48" stop-color="#E6E8DC" />
            <stop offset="1" stop-color="#CCD6C8" />
          </linearGradient>
          <!-- 远山：更亮、更低饱和 -->
          <linearGradient
            id="farMountainGradient"
            x1="0"
            y1="220"
            x2="1280"
            y2="500"
            gradientUnits="userSpaceOnUse"
          >
            <stop stop-color="#C1CBC0" />
            <stop offset="0.52" stop-color="#AEBCAE" />
            <stop offset="1" stop-color="#98AA9C" />
          </linearGradient>
          <!-- 中景山 -->
          <linearGradient
            id="middleMountainGradient"
            x1="620"
            y1="380"
            x2="620"
            y2="720"
            gradientUnits="userSpaceOnUse"
          >
            <stop stop-color="#A1B1A5" />
            <stop offset="1" stop-color="#7F9487" />
          </linearGradient>
          <!-- 近景山 -->
          <linearGradient
            id="nearMountainGradient"
            x1="640"
            y1="520"
            x2="640"
            y2="900"
            gradientUnits="userSpaceOnUse"
          >
            <stop stop-color="#789083" />
            <stop offset="1" stop-color="#526B60" />
          </linearGradient>
          <!-- 河流 -->
          <linearGradient
            id="riverGradient"
            x1="640"
            y1="420"
            x2="640"
            y2="900"
            gradientUnits="userSpaceOnUse"
          >
            <stop stop-color="#B8D1CF" />
            <stop offset="0.38" stop-color="#8FB7B3" />
            <stop offset="0.78" stop-color="#668E8D" />
            <stop offset="1" stop-color="#496F73" />
          </linearGradient>
          <!-- 河流暖色反光 -->
          <linearGradient
            id="riverHighlight"
            x1="625"
            y1="445"
            x2="625"
            y2="890"
            gradientUnits="userSpaceOnUse"
          >
            <stop stop-color="#FBF2D8" stop-opacity="0.85" />
            <stop offset="0.48" stop-color="#F7E8BF" stop-opacity="0.32" />
            <stop offset="1" stop-color="#F5E7BF" stop-opacity="0" />
          </linearGradient>
          <!-- 古镇建筑 -->
          <linearGradient
            id="villageWallGradient"
            x1="520"
            y1="560"
            x2="760"
            y2="720"
            gradientUnits="userSpaceOnUse"
          >
            <stop stop-color="#9A796C" />
            <stop offset="1" stop-color="#715B50" />
          </linearGradient>
          <!-- 柔焦雾气 -->
          <filter
            id="softBlur"
            x="-30%"
            y="-30%"
            width="160%"
            height="160%"
          >
            <feGaussianBlur stdDeviation="16" />
          </filter>
          <filter
            id="lightBlur"
            x="-40%"
            y="-40%"
            width="180%"
            height="180%"
          >
            <feGaussianBlur stdDeviation="32" />
          </filter>
          <!-- 只作用于河流水面，不作用于整幅画 -->
          <filter
            id="riverFlow"
            x="-12%"
            y="-12%"
            width="124%"
            height="124%"
          >
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.012 0.026"
              numOctaves="2"
              seed="18"
              result="riverNoise"
            >
              <animate
                attributeName="baseFrequency"
                dur="16s"
                values="
                  0.012 0.026;
                  0.015 0.020;
                  0.012 0.026
                "
                repeatCount="indefinite"
              />
            </feTurbulence>
            <feDisplacementMap
              ref="flowFilterRef"
              in="SourceGraphic"
              in2="riverNoise"
              scale="0.45"
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>
        </defs>
        <!-- 天空底层 -->
        <rect width="1280" height="900" fill="url(#skyGradient)" />
        <!-- 柔和晨光 -->
        <ellipse
          cx="945"
          cy="190"
          rx="290"
          ry="175"
          fill="#F8EED2"
          fill-opacity="0.62"
          filter="url(#lightBlur)"
          class="sun-glow"
        />
        <!-- ================================
             远山层
             ================================ -->
        <g ref="farMountainRef" class="scene-layer far-mountain">
          <path
            d="M0 400C124 336 220 342 332 388C448 435 496 294 628 326C753 355 799 437 910 391C1004 352 1102 275 1280 311V646H0V400Z"
            fill="url(#farMountainGradient)"
          />
          <path
            d="M0 442C154 388 264 407 390 450C531 499 601 366 723 390C843 414 915 483 1028 442C1114 411 1198 386 1280 409V646H0V442Z"
            fill="#B3C0B4"
            fill-opacity="0.52"
          />
        </g>
        <!-- ================================
             中景山层
             ================================ -->
        <g ref="middleMountainRef" class="scene-layer middle-mountain">
          <path
            d="M0 543C128 451 248 475 361 534C468 590 553 404 685 440C820 478 864 574 978 514C1070 466 1160 447 1280 484V735H0V543Z"
            fill="url(#middleMountainGradient)"
          />
          <path
            d="M0 602C131 550 238 565 356 620C487 680 591 514 714 546C838 578 924 678 1040 607C1136 549 1219 554 1280 575V750H0V602Z"
            fill="#8FA496"
            fill-opacity="0.68"
          />
        </g>
        <!-- ================================
             近景山层
             ================================ -->
        <g ref="nearMountainRef" class="scene-layer near-mountain">
          <path
            d="M0 682C133 566 288 602 426 676C540 737 609 536 765 580C899 619 1002 745 1280 620V900H0V682Z"
            fill="url(#nearMountainGradient)"
          />
        </g>
        <!-- ================================
             河流层
             ================================ -->
        <g ref="riverRef" class="scene-layer river-layer">
          <g filter="url(#riverFlow)">
            <path
              d="M625 434C690 484 703 540 670 596C636 654 554 704 578 761C605 827 711 846 789 900H367C439 837 499 788 475 730C451 671 449 620 494 565C540 509 557 468 625 434Z"
              fill="url(#riverGradient)"
            />
            <path
              d="M630 454C657 505 654 548 622 602C592 653 538 703 563 758C586 808 656 840 714 900H553C525 842 493 794 500 735C507 675 544 632 575 580C603 532 609 490 630 454Z"
              fill="url(#riverHighlight)"
            />
            <!-- 河面细纹 -->
            <g
              stroke="#F4F1DD"
              stroke-opacity="0.42"
              stroke-width="3"
              stroke-linecap="round"
            >
              <path d="M582 523C614 515 647 522 677 540" />
              <path d="M545 592C588 578 638 590 684 613" />
              <path d="M500 672C556 649 636 665 718 700" />
              <path d="M484 752C560 724 676 744 765 790" />
              <path d="M509 835C606 806 722 838 802 884" />
            </g>
          </g>
          <!-- 河面声音涟漪 -->
          <g
            class="sound-rings"
            fill="none"
            stroke="#F8F0D5"
            stroke-opacity="0.65"
          >
            <ellipse cx="622" cy="730" rx="34" ry="9" stroke-width="1.8" />
            <ellipse cx="622" cy="730" rx="58" ry="15" stroke-width="1.3" />
            <ellipse cx="622" cy="730" rx="88" ry="23" stroke-width="1" />
          </g>
        </g>
        <!-- ================================
             古镇建筑群
             ================================ -->
        <g ref="villageRef" class="scene-layer village-layer">
          <!-- 后排建筑 -->
          <path
            d="M554 574L605 536L656 574V632H554V574Z"
            fill="#876D61"
          />
          <path
            d="M542 575L605 527L669 575L605 593L542 575Z"
            fill="#4B413B"
          />
          <path
            d="M642 598L692 561L745 598V650H642V598Z"
            fill="#80675B"
          />
          <path
            d="M630 599L693 553L757 599L693 618L630 599Z"
            fill="#493F39"
          />
          <!-- 前排建筑 -->
          <path
            d="M489 627L543 587L599 627V684H489V627Z"
            fill="url(#villageWallGradient)"
          />
          <path
            d="M475 628L543 578L613 628L543 649L475 628Z"
            fill="#473D37"
          />
          <path
            d="M700 646L757 604L815 646V708H700V646Z"
            fill="#765F54"
          />
          <path
            d="M686 647L757 595L829 647L757 669L686 647Z"
            fill="#463C36"
          />
          <!-- 窗灯 -->
          <g fill="#DFC580" opacity="0.82">
            <rect x="567" y="597" width="9" height="15" rx="1" />
            <rect x="616" y="597" width="9" height="15" rx="1" />
            <rect x="662" y="617" width="9" height="15" rx="1" />
            <rect x="709" y="617" width="9" height="15" rx="1" />
            <rect x="514" y="652" width="10" height="16" rx="1" />
            <rect x="558" y="652" width="10" height="16" rx="1" />
            <rect x="725" y="673" width="10" height="16" rx="1" />
            <rect x="774" y="673" width="10" height="16" rx="1" />
          </g>
          <!-- 古镇上方淡炊烟 -->
          <path
            d="M605 530C585 505 626 493 606 470C588 447 619 434 610 411"
            stroke="#F0EFE2"
            stroke-opacity="0.34"
            stroke-width="8"
            stroke-linecap="round"
            filter="url(#softBlur)"
          />
        </g>
        <!-- ================================
             前景：河岸、芦苇、渡船
             ================================ -->
        <g ref="foregroundRef" class="scene-layer foreground-layer">
          <!-- 左右河岸 -->
          <path
            d="M0 776C130 720 261 741 377 797C461 839 533 843 591 829C542 864 513 885 495 900H0V776Z"
            fill="#526E62"
            fill-opacity="0.92"
          />
          <path
            d="M1280 757C1148 710 1016 729 901 790C821 833 735 847 668 829C719 866 751 885 771 900H1280V757Z"
            fill="#526E62"
            fill-opacity="0.93"
          />
          <!-- 芦苇 -->
          <g
            class="reeds"
            stroke="#B4B591"
            stroke-width="3"
            stroke-linecap="round"
            opacity="0.72"
          >
            <path d="M180 860C166 790 178 739 202 694" />
            <path d="M218 865C217 795 242 746 271 708" />
            <path d="M260 874C263 804 288 760 315 727" />
            <path d="M1018 866C1013 794 990 747 966 704" />
            <path d="M1065 870C1070 800 1094 752 1124 712" />
            <path d="M1111 876C1120 812 1154 768 1183 735" />
          </g>
        </g>
        <!-- 渡船单独一层，使其比河流更有景深 -->
        <g ref="boatRef" class="scene-layer boat-layer">
          <path
            d="M576 736C609 723 650 723 684 736C653 755 609 757 576 736Z"
            fill="#455958"
          />
          <path
            d="M628 727V683"
            stroke="#50635D"
            stroke-width="3"
            stroke-linecap="round"
          />
          <path
            d="M628 687L658 718H628V687Z"
            fill="#EEE4C8"
            fill-opacity="0.88"
          />
        </g>
        <!-- 前景薄雾 -->
        <path
          d="M60 661C205 614 340 641 468 676C586 708 733 671 880 648C1027 625 1143 646 1280 691V818C1131 773 1018 781 901 808C758 842 606 839 472 805C329 770 193 779 0 833V719C19 700 35 679 60 661Z"
          fill="#F7F5EA"
          fill-opacity="0.18"
          filter="url(#softBlur)"
        />
      </svg>

      <!-- 场景注释 -->
      <div class="scene-note">
        <span class="scene-note-dot"></span>
        <span>赤水河 · 太平渡</span>
      </div>
    </section>

    <!-- =================================================
         底部探索提示
         ================================================= -->

    <footer class="hero-footer">
      <div class="scroll-hint">
        <span>向下探索</span>
        <i></i>
        <ArrowDown :size="16" :stroke-width="1.5" />
      </div>
    </footer>
  </main>
</template>

<style scoped lang="scss">
/* =====================================================
   一、全局 Hero 环境
   ===================================================== */

.home-hero {
  --pointer-x: 72%;
  --pointer-y: 34%;

  position: relative;
  isolation: isolate;
  min-height: 100vh;
  overflow: hidden;
  color: #344139;
  background:
    radial-gradient(
      circle at 78% 17%,
      rgba(255, 248, 225, 0.88),
      transparent 26%
    ),
    radial-gradient(
      circle at 13% 76%,
      rgba(196, 212, 199, 0.44),
      transparent 36%
    ),
    linear-gradient(
      132deg,
      #f5f4ec 0%,
      #edf0e8 42%,
      #dce5d9 100%
    );
}

/* 纸本细纹：比之前更轻，避免脏灰 */
.paper-noise {
  position: absolute;
  z-index: -4;
  inset: 0;
  pointer-events: none;
  opacity: 0.2;
  background-image:
    repeating-linear-gradient(
      0deg,
      rgba(78, 91, 79, 0.025) 0,
      rgba(78, 91, 79, 0.025) 1px,
      transparent 1px,
      transparent 6px
    ),
    repeating-linear-gradient(
      90deg,
      rgba(255, 255, 255, 0.22) 0,
      rgba(255, 255, 255, 0.22) 1px,
      transparent 1px,
      transparent 8px
    );
  mix-blend-mode: multiply;
}

/* 页面固有环境光 */
.ambient-light {
  position: absolute;
  z-index: -3;
  pointer-events: none;
  border-radius: 50%;
  filter: blur(48px);
}

.ambient-light-one {
  top: -18%;
  right: 8%;
  width: min(55vw, 880px);
  aspect-ratio: 1;
  opacity: 0.32;
  background: rgba(255, 244, 210, 0.78);
  animation: ambientBreathOne 14s ease-in-out infinite alternate;
}

.ambient-light-two {
  bottom: -26%;
  left: -15%;
  width: min(48vw, 730px);
  aspect-ratio: 1;
  opacity: 0.24;
  background: rgba(164, 193, 181, 0.72);
  animation: ambientBreathTwo 18s ease-in-out infinite alternate;
}

/* 鼠标柔光，极低透明度，避免“手电筒”感 */
.pointer-light {
  position: absolute;
  z-index: -2;
  top: var(--pointer-y);
  left: var(--pointer-x);
  width: min(42vw, 630px);
  aspect-ratio: 1;
  pointer-events: none;
  opacity: 0.55;
  background: radial-gradient(
    circle,
    rgba(255, 252, 237, 0.46) 0%,
    rgba(250, 241, 211, 0.18) 32%,
    transparent 71%
  );
  filter: blur(20px);
  transform: translate(-50%, -50%);
  transition:
    top 0.85s ease-out,
    left 0.85s ease-out;
}

@keyframes ambientBreathOne {
  from {
    transform: translate3d(-16px, 4px, 0) scale(0.96);
  }

  to {
    transform: translate3d(22px, -10px, 0) scale(1.08);
  }
}

@keyframes ambientBreathTwo {
  from {
    transform: translate3d(8px, 0, 0) scale(0.95);
  }

  to {
    transform: translate3d(-14px, -16px, 0) scale(1.06);
  }
}

/* =====================================================
   二、统一 Hero 网格与顶部导航
   ===================================================== */

.hero-header {
  position: relative;
  z-index: 20;
  display: grid;
  grid-template-columns: minmax(220px, 1fr) auto minmax(220px, 1fr);
  align-items: center;
  width: min(calc(100% - 96px), 1520px);
  height: 92px;
  margin: 0 auto;
}

.brand {
  display: inline-flex;
  align-items: center;
  justify-self: start;
  gap: 11px;
  color: #344139;
  transition: opacity 0.25s ease;
}

.brand:hover {
  opacity: 0.72;
}

.brand-mark {
  position: relative;
  width: 31px;
  height: 31px;
  overflow: hidden;
  border: 1px solid rgba(69, 91, 79, 0.5);
  border-radius: 50%;
}

.brand-wave {
  position: absolute;
  left: 5px;
  width: 20px;
  height: 8px;
  border-top: 1.4px solid #9e4d47;
  border-radius: 50%;
  transform: rotate(-7deg);
}

.brand-wave-one {
  bottom: 6px;
}

.brand-wave-two {
  bottom: 11px;
  left: 8px;
  width: 15px;
  opacity: 0.58;
  border-color: #5b8a84;
}

.brand-text {
  display: flex;
  flex-direction: column;
  gap: 3px;
  line-height: 1;
}

.brand-text strong {
  font-family:
    "Noto Serif SC",
    "Songti SC",
    serif;
  font-size: 16px;
  font-weight: 600;
  letter-spacing: 0.12em;
}

.brand-text small {
  color: rgba(52, 65, 57, 0.58);
  font-family:
    "Cormorant Garamond",
    serif;
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.18em;
}

.desktop-nav {
  display: flex;
  align-items: center;
  justify-self: center;
  gap: clamp(26px, 2.35vw, 44px);
}

.nav-link {
  position: relative;
  padding: 8px 0;
  color: rgba(50, 63, 55, 0.67);
  font-size: 13px;
  letter-spacing: 0.05em;
  transition: color 0.26s ease;
}

.nav-link::after {
  position: absolute;
  right: 0;
  bottom: 0;
  left: 0;
  height: 1px;
  background: #a14b46;
  content: "";
  transform: scaleX(0);
  transform-origin: right;
  transition: transform 0.28s ease;
}

.nav-link:hover,
.nav-link.active {
  color: #334139;
}

.nav-link:hover::after,
.nav-link.active::after {
  transform: scaleX(1);
  transform-origin: left;
}

.header-actions {
  display: flex;
  justify-self: end;
}

.header-map-button {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  min-height: 45px;
  padding: 0 17px 0 20px;
  color: #fffaf0;
  background:
    linear-gradient(
      135deg,
      rgba(117, 80, 72, 0.94),
      rgba(100, 69, 63, 0.94)
    );
  border: 1px solid rgba(255, 255, 255, 0.24);
  border-radius: 999px;
  box-shadow: 0 12px 30px rgba(93, 66, 59, 0.16);
  font-size: 13px;
  letter-spacing: 0.05em;
  transition:
    transform 0.28s ease,
    background 0.28s ease,
    box-shadow 0.28s ease;
}

.header-map-button:hover {
  background:
    linear-gradient(
      135deg,
      rgba(149, 68, 63, 0.96),
      rgba(113, 67, 61, 0.96)
    );
  box-shadow: 0 16px 34px rgba(104, 61, 55, 0.24);
  transform: translateY(-2px);
}

.mobile-menu-button {
  display: none;
  width: 42px;
  height: 42px;
  place-items: center;
  color: #3b4a40;
  background: rgba(251, 249, 240, 0.62);
  border: 1px solid rgba(71, 90, 78, 0.18);
  border-radius: 50%;
  backdrop-filter: blur(12px);
}

/* =====================================================
   三、移动端菜单
   ===================================================== */

.mobile-nav {
  position: absolute;
  z-index: 30;
  top: 76px;
  right: 20px;
  display: flex;
  flex-direction: column;
  width: min(280px, calc(100vw - 40px));
  padding: 14px 18px;
  background: rgba(247, 246, 237, 0.93);
  border: 1px solid rgba(75, 91, 80, 0.15);
  border-radius: 18px;
  box-shadow: 0 22px 55px rgba(57, 73, 63, 0.14);
  backdrop-filter: blur(18px);
}

.mobile-nav a {
  padding: 14px 5px;
  color: #334139;
  border-bottom: 1px solid rgba(79, 97, 84, 0.11);
  font-size: 14px;
}

.mobile-nav a:last-child {
  border-bottom: 0;
}

.mobile-menu-fade-enter-active,
.mobile-menu-fade-leave-active {
  transition:
    opacity 0.24s ease,
    transform 0.24s ease;
}

.mobile-menu-fade-enter-from,
.mobile-menu-fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

/* =====================================================
   四、左侧文字排版
   ===================================================== */

.hero-copy {
  position: relative;
  z-index: 8;
  width: min(470px, 35vw);
  margin-top: clamp(115px, 14vh, 175px);
  margin-left: max(48px, calc((100vw - 1520px) / 2 + 26px));
}

.location-label {
  display: inline-flex;
  align-items: center;
  gap: 11px;
  color: rgba(56, 73, 63, 0.67);
  font-size: 11px;
  letter-spacing: 0.14em;
}

.location-line {
  display: inline-block;
  width: 31px;
  height: 1px;
  background: #a04b46;
}

.hero-title {
  display: flex;
  flex-direction: column;
  margin: 31px 0 0;
  color: #314037;
  line-height: 0.96;
}

.title-prefix {
  margin-bottom: 8px;
  font-family:
    "Noto Serif SC",
    "Songti SC",
    serif;
  font-size: clamp(30px, 2.5vw, 47px);
  font-weight: 400;
  letter-spacing: 0.17em;
}

.title-main {
  color: #994944;
  font-family:
    "Noto Serif SC",
    "Songti SC",
    serif;
  font-size: clamp(58px, 6.1vw, 106px);
  font-weight: 500;
  letter-spacing: 0.08em;
  text-shadow: 0 12px 28px rgba(142, 67, 62, 0.1);
}

.hero-subtitle {
  margin: 31px 0 0;
  color: #52685d;
  font-family:
    "Noto Serif SC",
    "Songti SC",
    serif;
  font-size: clamp(16px, 1.16vw, 19px);
  letter-spacing: 0.07em;
  line-height: 1.9;
}

.hero-description {
  max-width: 410px;
  margin: 16px 0 0;
  color: rgba(63, 80, 69, 0.66);
  font-family:
    "Noto Serif SC",
    "Songti SC",
    serif;
  font-size: 13px;
  letter-spacing: 0.055em;
  line-height: 2;
}

.hero-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 22px;
  margin-top: 38px;
}

.primary-action {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  min-height: 66px;
  padding: 9px 17px 9px 10px;
  color: #fffaf0;
  background:
    linear-gradient(
      135deg,
      #a44d47 0%,
      #864b45 58%,
      #76514b 100%
    );
  border: 1px solid rgba(255, 249, 230, 0.2);
  border-radius: 999px;
  box-shadow: 0 16px 35px rgba(128, 67, 61, 0.2);
  transition:
    box-shadow 0.28s ease,
    transform 0.28s ease;
}

.primary-action:hover {
  box-shadow: 0 20px 42px rgba(128, 67, 61, 0.28);
  transform: translateY(-3px);
}

.primary-action-icon {
  display: grid;
  width: 47px;
  height: 47px;
  place-items: center;
  background: rgba(255, 248, 226, 0.15);
  border: 1px solid rgba(255, 248, 226, 0.22);
  border-radius: 50%;
}

.primary-action-text {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.primary-action-text strong {
  font-size: 14px;
  font-weight: 500;
  letter-spacing: 0.06em;
}

.primary-action-text small {
  color: rgba(255, 247, 231, 0.7);
  font-size: 10px;
  letter-spacing: 0.03em;
}

.primary-action-arrow {
  margin-left: 3px;
}

.secondary-action {
  display: inline-flex;
  align-items: center;
  gap: 9px;
  padding: 8px 0;
  color: rgba(54, 75, 64, 0.8);
  background: transparent;
  border: 0;
  font-family:
    "Noto Serif SC",
    "Songti SC",
    serif;
  font-size: 13px;
  letter-spacing: 0.05em;
  transition:
    color 0.25s ease,
    transform 0.25s ease;
}

.secondary-action:hover {
  color: #964742;
  transform: translateX(3px);
}

.secondary-action-icon {
  display: grid;
  width: 31px;
  height: 31px;
  place-items: center;
  color: #6d938b;
  border: 1px solid rgba(94, 138, 131, 0.48);
  border-radius: 50%;
}

.headphone-note {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 28px;
  color: rgba(69, 84, 74, 0.52);
  font-size: 11px;
  letter-spacing: 0.04em;
}

.ambient-tip {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-top: 19px;
  padding: 9px 12px;
  color: rgba(61, 77, 67, 0.76);
  background: rgba(250, 248, 236, 0.52);
  border: 1px solid rgba(89, 112, 97, 0.16);
  border-radius: 8px;
  font-size: 11px;
  letter-spacing: 0.03em;
  backdrop-filter: blur(8px);
}

.tip-dot {
  width: 7px;
  height: 7px;
  background: #b78d58;
  border-radius: 50%;
}

.tip-fade-enter-active,
.tip-fade-leave-active {
  transition:
    opacity 0.28s ease,
    transform 0.28s ease;
}

.tip-fade-enter-from,
.tip-fade-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

/* =====================================================
   五、右侧艺术场景
   ===================================================== */

.scene-shell {
  position: absolute;
  z-index: 2;
  top: 0;
  right: -1%;
  width: min(68vw, 1120px);
  height: 100%;
  pointer-events: none;
  perspective: 1200px;
  transform-origin: 58% 58%;
  will-change: transform;

  /*
    让艺术场景向左侧雾化，不形成硬直线切割。
  */
  mask-image: linear-gradient(
    to right,
    transparent 0%,
    rgba(0, 0, 0, 0.3) 13%,
    #000 29%,
    #000 100%
  );
  -webkit-mask-image: linear-gradient(
    to right,
    transparent 0%,
    rgba(0, 0, 0, 0.3) 13%,
    #000 29%,
    #000 100%
  );
}

.landscape-svg {
  display: block;
  width: 100%;
  height: 100%;
  filter: drop-shadow(0 20px 32px rgba(67, 86, 73, 0.08));
}

.scene-layer {
  transform-box: fill-box;
  transform-origin: center;
  will-change: transform;
}

.sun-glow {
  animation: sunBreath 12s ease-in-out infinite alternate;
}

@keyframes sunBreath {
  from {
    opacity: 0.55;
    transform: translateX(-12px) scale(0.96);
  }

  to {
    opacity: 0.88;
    transform: translateX(16px) scale(1.08);
  }
}

/* 河流呼吸 */
.river-layer {
  animation: riverBreath 11s ease-in-out infinite alternate;
}

@keyframes riverBreath {
  from {
    filter: brightness(0.98);
  }

  to {
    filter: brightness(1.08);
  }
}

/* 声音从河面回响 */
.sound-rings {
  transform-origin: 622px 730px;
  animation: soundWave 5.8s ease-out infinite;
}

@keyframes soundWave {
  0% {
    opacity: 0.12;
    transform: scale(0.78);
  }

  46% {
    opacity: 0.7;
  }

  100% {
    opacity: 0;
    transform: scale(1.18);
  }
}

/* 芦苇轻微摆动 */
.reeds {
  transform-origin: center bottom;
  animation: reedSway 7.5s ease-in-out infinite alternate;
}

@keyframes reedSway {
  from {
    transform: rotate(-0.7deg);
  }

  to {
    transform: rotate(1.15deg);
  }
}

/* 渡船在水面轻微漂浮 */
.boat-layer {
  transform-origin: 628px 735px;
  animation: boatFloat 6.6s ease-in-out infinite alternate;
}

@keyframes boatFloat {
  from {
    transform: translateX(-3px) translateY(2px);
  }

  to {
    transform: translateX(4px) translateY(-2px);
  }
}

/* =====================================================
   六、独立雾层
   ===================================================== */

.scene-mist {
  position: absolute;
  z-index: 3;
  pointer-events: none;
  border-radius: 50%;
  background: rgba(249, 248, 238, 0.68);
  filter: blur(34px);
  mix-blend-mode: screen;
}

.mist-back {
  top: 24%;
  right: 8%;
  width: 46%;
  height: 14%;
  opacity: 0.3;
  animation: mistFloatOne 22s ease-in-out infinite alternate;
}

.mist-middle {
  top: 49%;
  left: 18%;
  width: 55%;
  height: 13%;
  opacity: 0.25;
  animation: mistFloatTwo 27s ease-in-out infinite alternate;
}

.mist-front {
  right: -4%;
  bottom: 12%;
  width: 62%;
  height: 15%;
  opacity: 0.2;
  animation: mistFloatThree 24s ease-in-out infinite alternate;
}

@keyframes mistFloatOne {
  from {
    transform: translate3d(0, 0, 0) scale(0.96);
  }

  to {
    transform: translate3d(-56px, 12px, 0) scale(1.1);
  }
}

@keyframes mistFloatTwo {
  from {
    transform: translate3d(-10px, 0, 0) scale(1);
  }

  to {
    transform: translate3d(40px, -12px, 0) scale(1.13);
  }
}

@keyframes mistFloatThree {
  from {
    transform: translate3d(0, 0, 0) scale(0.98);
  }

  to {
    transform: translate3d(-42px, -14px, 0) scale(1.08);
  }
}

/* =====================================================
   七、场景标记和年份
   ===================================================== */

.time-mark {
  position: absolute;
  z-index: 6;
  top: 26%;
  right: 7%;
  display: flex;
  align-items: center;
  gap: 10px;
  color: rgba(78, 91, 78, 0.5);
  font-family:
    "Cormorant Garamond",
    "Noto Serif SC",
    serif;
  font-size: 15px;
  font-weight: 600;
  letter-spacing: 0.1em;
}

.time-mark i {
  display: inline-block;
  width: 27px;
  height: 1px;
  background: rgba(159, 75, 69, 0.65);
}

.scene-note {
  position: absolute;
  z-index: 7;
  right: 16%;
  bottom: 19%;
  display: flex;
  align-items: center;
  gap: 8px;
  color: rgba(250, 246, 225, 0.9);
  font-size: 10px;
  letter-spacing: 0.1em;
  text-shadow: 0 2px 10px rgba(47, 72, 65, 0.3);
}

.scene-note-dot {
  position: relative;
  width: 8px;
  height: 8px;
  background: #e5c77d;
  border-radius: 50%;
}

.scene-note-dot::after {
  position: absolute;
  inset: -5px;
  border: 1px solid rgba(240, 214, 140, 0.56);
  border-radius: 50%;
  content: "";
  animation: markerPulse 2.7s ease-out infinite;
}

@keyframes markerPulse {
  0% {
    opacity: 0.75;
    transform: scale(0.6);
  }

  100% {
    opacity: 0;
    transform: scale(1.7);
  }
}

/* =====================================================
   八、底部探索提示
   ===================================================== */

.hero-footer {
  position: absolute;
  z-index: 10;
  bottom: 39px;
  left: max(48px, calc((100vw - 1520px) / 2 + 26px));
}

.scroll-hint {
  display: flex;
  align-items: center;
  gap: 10px;
  color: rgba(61, 76, 66, 0.55);
  font-size: 10px;
  letter-spacing: 0.15em;
}

.scroll-hint i {
  width: 37px;
  height: 1px;
  background: rgba(81, 93, 79, 0.36);
}

.scroll-hint svg {
  animation: scrollArrow 2.2s ease-in-out infinite;
}

@keyframes scrollArrow {
  0%,
  100% {
    transform: translateY(-2px);
  }

  50% {
    transform: translateY(3px);
  }
}

/* =====================================================
   九、点击水波纹
   ===================================================== */

.click-ripple {
  position: absolute;
  z-index: 15;
  width: 10px;
  height: 10px;
  pointer-events: none;
  border: 1px solid rgba(247, 236, 197, 0.85);
  border-radius: 50%;
  transform: translate(-50%, -50%);
  animation: pageRipple 1.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

.click-ripple::before,
.click-ripple::after {
  position: absolute;
  border: 1px solid rgba(183, 213, 202, 0.52);
  border-radius: 50%;
  content: "";
}

.click-ripple::before {
  inset: 8px;
}

.click-ripple::after {
  inset: 20px;
  border-color: rgba(245, 227, 182, 0.28);
}

@keyframes pageRipple {
  0% {
    opacity: 0.85;
    transform: translate(-50%, -50%) scale(0.2);
  }

  100% {
    opacity: 0;
    transform: translate(-50%, -50%) scale(30);
  }
}

/* =====================================================
   十、中等桌面屏幕适配
   ===================================================== */

@media (max-width: 1180px) {
  .hero-header {
    width: calc(100% - 60px);
  }

  .hero-copy {
    width: min(470px, 43vw);
    margin-left: 30px;
  }

  .scene-shell {
    right: -9%;
    width: 75vw;
  }

  .hero-footer {
    left: 30px;
  }
}

/* =====================================================
   十一、平板与移动端适配
   ===================================================== */

@media (max-width: 760px) {
  .home-hero {
    min-height: 100svh;
  }

  .hero-header {
    display: flex;
    justify-content: space-between;
    width: calc(100% - 38px);
    height: 76px;
  }

  .desktop-nav,
  .header-map-button {
    display: none;
  }

  .mobile-menu-button {
    display: grid;
  }

  .hero-copy {
    width: calc(100% - 44px);
    margin-top: 85px;
    margin-left: 22px;
  }

  .location-label {
    font-size: 10px;
  }

  .hero-title {
    margin-top: 25px;
  }

  .title-prefix {
    font-size: 27px;
  }

  .title-main {
    font-size: clamp(53px, 16vw, 76px);
  }

  .hero-subtitle {
    max-width: 320px;
    margin-top: 23px;
    font-size: 15px;
    line-height: 1.75;
  }

  .hero-description {
    max-width: 315px;
    font-size: 12px;
    line-height: 1.85;
  }

  .hero-actions {
    gap: 14px;
    margin-top: 28px;
  }

  .primary-action {
    min-height: 58px;
    padding-right: 14px;
  }

  .primary-action-icon {
    width: 40px;
    height: 40px;
  }

  .primary-action-text small {
    display: none;
  }

  .secondary-action {
    font-size: 12px;
  }

  .headphone-note,
  .ambient-tip {
    display: none;
  }

  .scene-shell {
    top: auto;
    right: -25%;
    bottom: -3%;
    width: 126vw;
    height: 64vh;
    mask-image: linear-gradient(
      to bottom,
      transparent 0%,
      #000 22%,
      #000 100%
    );
    -webkit-mask-image: linear-gradient(
      to bottom,
      transparent 0%,
      #000 22%,
      #000 100%
    );
  }

  .time-mark,
  .scene-note {
    display: none;
  }

  .hero-footer {
    display: none;
  }

  .mist-back {
    top: 30%;
    width: 62%;
  }

  .mist-middle {
    top: 50%;
    width: 72%;
  }

  .mist-front {
    width: 78%;
  }

  .pointer-light {
    opacity: 0.3;
  }
}

/* =====================================================
   十二、减少动态效果设置
   ===================================================== */

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }

  .pointer-light {
    display: none;
  }
}
</style>