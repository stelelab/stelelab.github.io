window.addEventListener('coreLoaded', async function () {
  let hash = window.location.hash.replace('#', '')
  let address, username

  // Checking address and username
  if (hash.startsWith('0x')) {
    // TODO: Check address valid
    address = hash
    username = await window._stele.getUsername(hash)
  } else {
    address = await window._stele.getAddress(hash)
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
  let descriptionIdx = await window._stele.Description.methods.description(address).call()
  let description = await window._stele.Description.getPastEvents('Updated', {
    fromBlock: 8194784,
    filter: {
      descriptionIdx: [descriptionIdx]
    }
  })
  if (description.length > 0) {
    document.querySelector('#user-information .description').textContent = description[0].returnValues.data
  }

  let accounts = await window.ethereum.enable()
  if (accounts[0].toLowerCase() === address.toLowerCase()) {
    document.querySelector('#user-specific-region').style.display = 'block'
  }

  window._stele.loadPageWithUserAddress(address)
})
