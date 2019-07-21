window.addEventListener('coreLoaded', async function () {
  let hash = window.location.hash.replace('#', '')
  let address, username
  if (hash.startsWith('0x')) {
    address = hash
    username = await window._xpost.getUsername(hash)
  } else {
    address = await window._xpost.getAddress(hash)
    if (address === '0x0000000000000000000000000000000000000000') {
      document.querySelector('#user-not-found').textContent = `User "${hash}" not exists`
      document.querySelector('#user-not-found').style.display = 'block'
      return
    }
    username = hash
  }

  if (username.length > 0) {
    document.querySelector('#user-information .username').textContent = `@${username}`
  }
  document.querySelector('#user-information .address').textContent = address

  // Load description
  let descriptionIdx = await window._xpost.Description.methods.description(address).call()
  let description = await window._xpost.Description.getPastEvents('Updated', {
    fromBlock: 8194784,
    filter: {
      descriptionIdx: [descriptionIdx]
    }
  })
  if (description.length > 0) {
    document.querySelector('#user-information .description').textContent = description[0].returnValues.data
  }

  window._xpost.loadPageWithUserAddress(address)
})
