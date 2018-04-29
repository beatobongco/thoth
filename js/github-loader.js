/*
  A component that allows you to do CRUD stuff from a
  public github URL.
*/

Vue.component('github-loader', {
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
      superagent
        .get(this.apiURL)
        .then(function (res) {
          this.results = res.body
        }.bind(this))
    },
    loadNote: function (note) {
      app.setMode('editor')
      app.setTarget(note)
    }
  },
  template: `
  <ul>
    <li v-for="res in results">
      <a href="#"
        @click.prevent="loadNote(res)">
        {{res.name}}
      </a>
    </li>
  </ul>
  `
})
