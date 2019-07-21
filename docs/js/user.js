window._xpost.pageAppStart = async function () {
  let username = window.location.hash.replace('#', '')
  let address
  if (username.startsWith('0x')) {
    address = username
  } else {
    address = await window._xpost.getAddress(username)
    if (address === '0x0000000000000000000000000000000000000000') {
      document.querySelector('#user-not-found').textContent = `User "${username}" not exists`
      document.querySelector('#user-not-found').style.display = 'block'
      return
    }
  }
  window._xpost.loadPageWithUserAddress(address)
}
