window.addEventListener('coreLoaded', async function () {
  let hash = window.location.hash.replace('#', '')
  let address, username

  // Checking address and username
  if (hash.startsWith('@')) {
    username = hash.substr(1)
    address = await window._stele.getAddress(username)
    if (address === '0x0000000000000000000000000000000000000000') {
      window._stele.showNotFound(`User "${hash}" not exists`)
      return
    }
  } else if (hash.startsWith('0x')) {
    if (!web3.utils.isAddress(hash)) {
      window._stele.showNotFound(`Address "${hash}" is not a valid address`)
      return
    }
    address = hash
    username = await window._stele.getUsername(hash)
  } else {
    window._stele.showNotFound(`"${hash}" is not a valid user`)
    return
  }

  if (username.length > 0) {
    document.querySelector('#user-information .username').textContent = `@${username}`
  }
  document.querySelector('#user-information .address').textContent = address
  document.querySelector('#user-information .address-link').href = `https://etherscan.io/address/${address}`

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

  if (window.hasMetamask) {
    let accounts = await window.ethereum.enable()
    if (accounts[0].toLowerCase() === address.toLowerCase()) {
      document.querySelector('#user-specific-region').style.display = 'block'
      document.querySelector('button[name="set-username"]').addEventListener('click', window._stele.setUsername)
      document.querySelector('button[name="set-description"]').addEventListener('click', window._stele.setDescription)
    }
  }

  window._stele.loadPageWithUserAddress(address)
})
