window._xpost.pageAppStart = async function () {
  console.log('home page')
  window._xpost.pageShouldLoad = true

  let postIdx = await window._xpost.getPostIdx()
  window._xpost.startLoadingCheck(postIdx)

  window.addEventListener('scroll', async function (event) {
    if (document.documentElement.scrollHeight - event.pageY < document.documentElement.clientHeight * 2) {
      window._xpost.pageShouldLoad = true
    }
  })
}
