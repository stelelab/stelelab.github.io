window.addEventListener('coreLoaded', async function () {
  let index = parseInt(window.location.hash.replace('#', ''))
  window._xpost.loadWithIdx(index)
})
