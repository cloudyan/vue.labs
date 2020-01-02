import api from '@/api'
import {
  // cookie,
  storage,
  isEmptyObject,
} from '@dwdjs/utils'

let userInfo = storage.get('userInfo') || {}

// const cookieKey = 'dwdus_sid';
function getLoginStatus(data = {}) {
  // return !!cookie.get(cookieKey) || !!(data.token && data.id);
  return !!(data.token && data.id)
}

const user = {
  namespaced: true,
  state: {
    userInfo: userInfo,
    logged: getLoginStatus(userInfo),
    roles: [],
    isLock: storage.get('isLock') || false,
    lockPasswd: storage.get('lockPasswd') || '',
  },

  mutations: {
    // 全量更新
    SET_USERINFO: (state, data = {}) => {
      if (isEmptyObject(data)) {
        state.userInfo = {}
        state.logged = false
        storage.remove('userInfo')
        return
      }
      const newData = {
        ...state.userInfo,
        ...data,
      }
      state.userInfo = newData
      state.logged = getLoginStatus(newData)
      api.setHeader({
        token: newData.token || '',
        userId: newData.id || '',
      })
      api.setCommonParams({
        token: newData.token || '',
        user_id: newData.id || '',
      })
      storage.set('userInfo', newData, 86400 * 30)
    },
    SET_SETTING: (state, setting) => {
      state.setting = setting
    },
    SET_ROLES: (state, roles) => {
      state.roles = roles
    },
    SET_LOCK_PASSWD: (state, lockPasswd) => {
      state.lockPasswd = lockPasswd
      storage.set('lockPasswd', {
        content: state.lockPasswd,
        type: 'session',
      })
    },
    CLEAR_LOCK: (state, action) => {
      state.isLock = false
      state.lockPasswd = ''
      storage.remove('lockPasswd')
      storage.remove('isLock')
    },
  },

  actions: {
    // 用户名登录
    Login({ commit, state }, loginForm) {
      return new Promise((resolve, reject) => {
        api.login(
          {
            ...loginForm,
          },
          res => {
            const { data } = res
            commit('SET_USERINFO', data)
            resolve(res)
          },
          err => {
            reject(err)
          }
        )
      })
    },

    // 获取用户信息
    GetUserInfo({ commit, state }) {
      return new Promise((resolve, reject) => {
        api.getUserInfo(
          {},
          res => {
            const { data } = res
            // 由于 mockjs 不支持自定义状态码只能这样hack
            if (!data) {
              reject('error')
              return
            }
            data.roles = ['admin']
            // 验证返回的roles是否是一个非空数组
            if (data.roles && data.roles.length > 0) {
              commit('SET_ROLES', data.roles)
            } else {
              /* eslint prefer-promise-reject-errors: 0 */
              reject('getInfo: roles must be a non-null array !')
            }
            commit('SET_USERINFO', data)
            resolve(res)
          },
          err => {
            reject(err)
            // 这里统一鉴权提示报错
            return true
          }
        )
      })
    },

    // 登出
    Logout({ commit, state }) {
      return new Promise((resolve, reject) => {
        api.logout(
          {},
          res => {
            commit('SET_USERINFO', {})
            resolve({})
          },
          err => {
            reject(err)
          }
        )
      })
    },

    // 前端 登出
    FedLogout({ commit }) {
      return new Promise(resolve => {
        commit('SET_USERINFO', {})
        resolve({})
      })
    },

    // 动态修改权限
    // ChangeRoles({ commit }, role) {
    //   return new Promise((resolve) => {
    //     commit('SET_TOKEN', role)
    //     // setToken(role)
    //     getUserInfo({ role }).then((res) => {
    //       const { data } = res
    //       data.roles = ['admin']
    //       commit('SET_ROLES', data.roles)
    //       commit('SET_NAME', data.name)
    //       commit('SET_AVATAR', data.avatar)
    //       commit('SET_INTRODUCTION', data.introduction)
    //       resolve()
    //     })
    //   })
    // },
  },
}

export default user
