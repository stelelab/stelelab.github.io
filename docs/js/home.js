window.addEventListener('coreLoaded', async function () {
  window._stele.pageShouldLoad = true
  window._stele.startLoadingCheck()

  window.addEventListener('scroll', async function (event) {
    let scrollTop = Math.max(window.pageYOffset, document.documentElement.scrollTop, document.body.scrollTop)
    if (document.documentElement.scrollHeight - scrollTop < document.documentElement.clientHeight * 2) {
      window._stele.pageShouldLoad = true
    }
  })
})
