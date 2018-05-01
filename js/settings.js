var AUTOSAVE_INTERVAL = 5000
var API_URL = 'https://api.github.com/repos/beatobongco/TIL/contents/day_notes/'
var EDIT_URL = 'https://github.com/beatobongco/TIL/edit/master/day_notes/2018-04-24_Interview_v3.md'
var POST_URL = 'https://github.com/beatobongco/TIL/new/master/day_notes'
var CARET = '<span class="cursor blinking-cursor">|</span>'
var LOCAL_PREFIX = 'thoth-local-'

//TODO: validate token
//https://stackoverflow.com/questions/22438805/github-api-oauth-token-validation

localforage.getItem('thoth-access-token')
  .then(function (val) {
    var accessToken = null
    if (val) {
      accessToken = val
    } else {
      accessToken = prompt('Optional: enter oauth token')
      localforage.setItem('thoth-access-token', accessToken)
    }
    if (accessToken) {
      API_URL += '?access_token=' + accessToken
    }
  })
