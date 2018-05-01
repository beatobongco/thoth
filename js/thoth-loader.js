/*
  A component that allows you to do load stuff from a
  public github URL as well as local storage.
*/

Vue.component('thoth-loader', {
  data: function () {
    return {
      apiURL: API_URL,
      results: []
    }
  },
  mounted: function () {
    this.load()
  },
  methods: {
    load: function () {
      let _this = this

      // load from local
      localforage.keys()
        .then(function (keys) {
          var localKeys = keys.filter(function (res) {
            return res.includes(LOCAL_PREFIX)
          })
          localKeys.forEach(function (key) {
            _this.results.push({
              name: key.replace(LOCAL_PREFIX, ''),
              key: key,
              thothSource: 'local'})
          })
        })

      // load from Github
      .then(function () {
        superagent
          .get(_this.apiURL)
          .then(function (res) {
            res.body.forEach(function (res) {
              res['thothSource'] = 'github'
              _this.results.push(res)
            })
          })

      })


    },
    loadNote: function (note) {
      function _getData(note) {
        return new Promise(function (resolve) {
          if (note.thothSource === 'github') {
            let _key = 'thoth-github-' + note.name
            let _url = note.html_url.replace('/blob/', '/edit/')
            localforage
              .getItem(_key)
              .then(function (res) {
                if (res) {
                  resolve({
                    key: _key,
                    content: res,
                    postURL: _url
                  })
                } else {
                  superagent
                    .get(note.download_url)
                    .then(function (res) {
                      resolve({
                        key: _key,
                        content: res.text,
                        postURL: _url
                      })
                    })
                }
              })
          } else if (note.thothSource === 'local') {
            localforage
              .getItem(note.key)
              .then(function (res) {
                resolve({
                  key: note.key,
                  content: res,
                  postURL: ('https://github.com/beatobongco/TIL/new/master/day_notes?filename='
                            + note.name)
                })
              })
          }

        })
      }

      _getData(note)
        .then(function (res) {
          app.setMode('editor')
          app.setPost({
            key: res.key,
            name: note.name,
            content: res.content,
            postURL: res.postURL
          })
        })
    },
    createNew: function () {
      app.setMode('editor')
      let id = cuid()
      app.setPost({
        key: LOCAL_PREFIX + id,
        name: id,
        content: '',
        postURL: 'https://github.com/beatobongco/TIL/new/master/day_notes?filename=' + id
      })
    }
  },
  template: `
  <ul class="loader">
    <li>
      <a href="#" @click.prevent="createNew">
        Create new note
      </a>
    </li>
    <li v-for="res in results">
      <a href="#"
        @click.prevent="loadNote(res)">
        {{res.name}}
      </a>
    </li>
  </ul>
  `
})
