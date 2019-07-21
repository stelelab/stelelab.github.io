window._xpost.pageAppStart = async function () {
  window._xpost.pageShouldLoad = true
  window._xpost.startLoadingCheck()

  window.addEventListener('scroll', async function (event) {
    if (document.documentElement.scrollHeight - event.pageY < document.documentElement.clientHeight * 2) {
      window._xpost.pageShouldLoad = true
    }
  })
}
