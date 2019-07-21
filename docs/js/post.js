window._xpost.pageAppStart = async function () {
  let index = parseInt(window.location.hash.replace('#', ''))
  window._xpost.loadWithIdx(index)
}
