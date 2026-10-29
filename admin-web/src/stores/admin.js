import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

const TOKEN_KEY = 'admin_token'
const ADMIN_INFO_KEY = 'admin_info'

export const useAdminStore = defineStore('admin', () => {
  const token = ref(
    localStorage.getItem(TOKEN_KEY) || ''
  )

  const adminInfo = ref(
    JSON.parse(
      localStorage.getItem(ADMIN_INFO_KEY) || 'null'
    )
  )

  const isLoggedIn = computed(() => Boolean(token.value))

  function setLogin(loginToken, info) {
    token.value = loginToken
    adminInfo.value = info

    localStorage.setItem(TOKEN_KEY, loginToken)
    localStorage.setItem(
      ADMIN_INFO_KEY,
      JSON.stringify(info)
    )
  }

  function logout() {
    token.value = ''
    adminInfo.value = null

    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(ADMIN_INFO_KEY)
  }

  return {
    token,
    adminInfo,
    isLoggedIn,
    setLogin,
    logout
  }
})