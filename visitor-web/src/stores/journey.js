import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

const STORAGE_KEY = 'chishui_echo_journey_state'

function createDefaultState() {
  return {
    checkedInSpotIds: [],
    favoriteSpotIds: [],
    listenedSpotIds: [],
    completedQuizSpotIds: [],
    earnedBadgeIds: []
  }
}

function readLocalState() {
  try {
    const rawValue = localStorage.getItem(STORAGE_KEY)

    if (!rawValue) {
      return createDefaultState()
    }

    const parsedValue = JSON.parse(rawValue)

    return {
      ...createDefaultState(),
      ...parsedValue
    }
  } catch (error) {
    console.warn('读取本地旅程状态失败，将使用默认状态。', error)

    return createDefaultState()
  }
}

export const useJourneyStore = defineStore('journey', () => {
  const initialState = readLocalState()

  const checkedInSpotIds = ref(initialState.checkedInSpotIds)
  const favoriteSpotIds = ref(initialState.favoriteSpotIds)
  const listenedSpotIds = ref(initialState.listenedSpotIds)
  const completedQuizSpotIds = ref(initialState.completedQuizSpotIds)
  const earnedBadgeIds = ref(initialState.earnedBadgeIds)

  const checkedInCount = computed(() => checkedInSpotIds.value.length)

  function saveState() {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        checkedInSpotIds: checkedInSpotIds.value,
        favoriteSpotIds: favoriteSpotIds.value,
        listenedSpotIds: listenedSpotIds.value,
        completedQuizSpotIds: completedQuizSpotIds.value,
        earnedBadgeIds: earnedBadgeIds.value
      })
    )
  }

  function includesSpot(list, spotId) {
    return list.includes(Number(spotId))
  }

  function isCheckedIn(spotId) {
    return includesSpot(checkedInSpotIds.value, spotId)
  }

  function isFavorite(spotId) {
    return includesSpot(favoriteSpotIds.value, spotId)
  }

  function isListened(spotId) {
    return includesSpot(listenedSpotIds.value, spotId)
  }

  function isQuizCompleted(spotId) {
    return includesSpot(completedQuizSpotIds.value, spotId)
  }

  function addUniqueItem(listRef, value) {
    const numericValue = Number(value)

    if (!listRef.value.includes(numericValue)) {
      listRef.value.push(numericValue)
    }
  }

  function removeItem(listRef, value) {
    const numericValue = Number(value)

    listRef.value = listRef.value.filter(
      (item) => item !== numericValue
    )
  }

  function markListened(spotId) {
    addUniqueItem(listenedSpotIds, spotId)
    updateBadges()
    saveState()
  }

  function checkInSpot(spotId) {
    addUniqueItem(checkedInSpotIds, spotId)
    updateBadges()
    saveState()
  }

  function toggleFavorite(spotId) {
    if (isFavorite(spotId)) {
      removeItem(favoriteSpotIds, spotId)
    } else {
      addUniqueItem(favoriteSpotIds, spotId)
    }

    saveState()
  }

  function completeQuiz(spotId) {
    addUniqueItem(completedQuizSpotIds, spotId)
    updateBadges()
    saveState()
  }

  function updateBadges() {
    const badges = []

    /*
      渡口聆听者：
      已完成太平渡渡口导览。
    */
    if (
      checkedInSpotIds.value.includes(5) ||
      listenedSpotIds.value.includes(5)
    ) {
      badges.push('ferry-listener')
    }

    /*
      古镇寻迹者：
      已完成至少 3 个点位打卡。
    */
    if (checkedInSpotIds.value.length >= 3) {
      badges.push('town-explorer')
    }

    /*
      赤水回声行者：
      已完成全部 5 个核心点位打卡。
    */
    if (checkedInSpotIds.value.length >= 5) {
      badges.push('chishui-walker')
    }

    earnedBadgeIds.value = badges
  }

  function resetJourney() {
    const defaultState = createDefaultState()

    checkedInSpotIds.value = defaultState.checkedInSpotIds
    favoriteSpotIds.value = defaultState.favoriteSpotIds
    listenedSpotIds.value = defaultState.listenedSpotIds
    completedQuizSpotIds.value = defaultState.completedQuizSpotIds
    earnedBadgeIds.value = defaultState.earnedBadgeIds

    saveState()
  }

  function getCompletionRate(totalSpots = 5) {
    if (totalSpots <= 0) {
      return 0
    }

    return Math.round(
      (checkedInSpotIds.value.length / totalSpots) * 100
    )
  }

  return {
    checkedInSpotIds,
    favoriteSpotIds,
    listenedSpotIds,
    completedQuizSpotIds,
    earnedBadgeIds,
    checkedInCount,

    isCheckedIn,
    isFavorite,
    isListened,
    isQuizCompleted,

    markListened,
    checkInSpot,
    toggleFavorite,
    completeQuiz,
    resetJourney,
    getCompletionRate
  }
})
