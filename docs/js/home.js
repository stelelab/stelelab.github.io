window.addEventListener('coreLoaded', async function () {
  window._xpost.pageShouldLoad = true
  window._xpost.startLoadingCheck()

  window.addEventListener('scroll', async function (event) {
    let scrollTop = Math.max(window.pageYOffset, document.documentElement.scrollTop, document.body.scrollTop)
    if (document.documentElement.scrollHeight - scrollTop < document.documentElement.clientHeight * 2) {
      window._xpost.pageShouldLoad = true
    }
  })
})
