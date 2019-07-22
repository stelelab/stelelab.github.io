window._stele = {}
window._stele.isWeb3Actioning = false
window._stele.tooltipShowUntil = null
window._stele.usernameCache = {}

window._stele.copyToClipboard = async function (data) {
  let node = document.createElement('textarea')
  node.textContent = data
  node.style.opacity = 0.0001
  document.body.appendChild(node)
  node.select()
  document.execCommand('copy')
  document.body.removeChild(node)
  window._stele.showToolTip('Copied!', 3000)
}

window._stele.showToolTip = async function (message, time = 5000) {
  let popup = document.querySelector('#tooltip .popup')
  popup.textContent = message
  popup.classList.add('show')
  window._stele.tooltipShowUntil = (new Date()).getTime() + time
  setTimeout(function () {
    if ((new Date()).getTime() >= window._stele.tooltipShowUntil) {
      popup.classList.remove('show')
    }
  }, time + 500)
}

window._stele.getPostCount = async function () {
  return window._stele.Post.methods.postIdx().call().then(function (result) {
    return result - 1
  })
}

window._stele.getUsername = async function (address) {
  if (address in window._stele.usernameCache) {
    return window._stele.usernameCache[address]
  }
  return window._stele.Username.methods.username(address).call().then(function (result) {
    let username = window.web3.utils.toAscii(result.replace(/0+$/g, ''))
    window._stele.usernameCache[address] = username
    return username
  })
}

window._stele.getAddress = async function (username) {
  return window._stele.Username.methods.owner(web3.utils.fromAscii(username)).call().then(function (result) {
    return result
  })
}

window._stele.startLoadingCheck = async function startLoadingCheck (postIdx) {
  const pageSize = 10
  if (typeof postIdx === 'undefined') {
    postIdx = await window._stele.getPostCount()
  }

  if (window._stele.pageShouldLoad) {
    if (postIdx >= 0) {
      await window._stele.loadPage(postIdx, pageSize)
      postIdx -= pageSize
    }
    window._stele.pageShouldLoad = false
  }
  setTimeout(function () { window._stele.startLoadingCheck(postIdx) }, 100)
}

window._stele.loadWithIdx = async function (idx) {
  return window._stele.Post.getPastEvents('Posted', {
    fromBlock: 8192055,
    filter: {
      postIdx: [idx]
    }
  }).then(async function (posts) {
    for (let i = posts.length - 1; i >= 0; i--) {
      await window._stele.appendPost(posts[i])
    }
  })
}

window._stele.loadPageWithUserAddress = async function (address) {
  return window._stele.Post.getPastEvents('Posted', {
    fromBlock: 8192055,
    filter: {
      creator: [address]
    }
  }).then(async function (posts) {
    for (let i = posts.length - 1; i >= 0; i--) {
      await window._stele.appendPost(posts[i])
    }
  })
}

window._stele.loadPage = async function (lastIdx, pageSize) {
  let postIdxList = []
  for (let i = 0; i < pageSize && lastIdx - i >= 0; i++) {
    postIdxList.push(lastIdx - i)
  }

  return window._stele.Post.getPastEvents('Posted', {
    fromBlock: 8192055,
    filter: {
      postIdx: postIdxList
    }
  }).then(async function (posts) {
    for (let i = posts.length - 1; i >= 0; i--) {
      await window._stele.appendPost(posts[i])
    }
  })
}

window._stele.appendPost = async function (post) {
  // Post header
  let postNumberWrap = document.createElement('a')
  let postNumber = document.createElement('span')
  postNumber.classList.add('number')
  postNumber.textContent = `#${post.returnValues.postIdx}`
  postNumberWrap.href = `${window.location.protocol}//${window.location.host}/p/${post.returnValues.postIdx}`
  postNumberWrap.appendChild(postNumber)

  let postCreatorWrap = document.createElement('a')
  let postCreator = document.createElement('span')
  let userName = await window._stele.getUsername(post.returnValues.creator)
  postCreator.classList.add('creator')
  postCreator.classList.add('address')
  if (userName.length > 0) {
    postCreator.textContent = '@' + userName
  } else {
    postCreator.textContent = post.returnValues.creator
  }
  postCreatorWrap.href = `${window.location.protocol}//${window.location.host}/u/${postCreator.textContent}`
  postCreatorWrap.appendChild(postCreator)

  let postBlockHeightWrap = document.createElement('a')
  let postBlockHeight = document.createElement('span')
  postBlockHeight.classList.add('block-height')
  postBlockHeight.textContent = `- ${post.blockNumber}`
  postBlockHeightWrap.href = `https://etherscan.io/tx/${post.transactionHash}`
  postBlockHeightWrap.target = '_blank'
  postBlockHeightWrap.appendChild(postBlockHeight)

  let postHeader = document.createElement('div')
  postHeader.classList.add('post-info')

  postHeader.appendChild(postNumberWrap)
  postHeader.appendChild(postCreatorWrap)
  postHeader.appendChild(postBlockHeightWrap)

  // Post content
  let postContent = document.createElement('div')
  postContent.classList.add('post-content')
  postContent.textContent = post.returnValues.data

  // Post footer
  let likeButton = document.createElement('button')
  likeButton.textContent = 'Like'
  likeButton.classList.add('lite')

  let commentButton = document.createElement('button')
  commentButton.textContent = 'Comment'
  commentButton.classList.add('lite')

  let copyLinkButton = document.createElement('button')
  copyLinkButton.textContent = 'Copy Link'
  copyLinkButton.classList.add('lite')
  copyLinkButton.classList.add('copy-link')
  copyLinkButton.addEventListener('click', function () { window._stele.copyToClipboard(postNumberWrap.href) })

  let postFooter = document.createElement('div')
  postFooter.classList.add('post-footer')
  // postFooter.appendChild(likeButton)
  // postFooter.appendChild(commentButton)
  postFooter.appendChild(copyLinkButton)

  // Combine to post
  let postBlock = document.createElement('div')
  postBlock.classList.add('post')
  postBlock.appendChild(postHeader)
  postBlock.appendChild(postContent)
  postBlock.appendChild(postFooter)

  let timeline = document.querySelector('#post-timeline')
  timeline.appendChild(postBlock)
}

window._stele.showPostDialog = async function () {
  document.querySelector('#post-dialog').style.display = 'flex'
  document.querySelector('body').classList.add('modal-opened')
}

window._stele.closePostDialog = async function () {
  document.querySelector('#post-dialog').style.display = 'none'
  document.querySelector('body').classList.remove('modal-opened')
}

window._stele.createPost = async function () {
  if (!window._stele.isWeb3Actioning) {
    let textArea = document.querySelector('textarea[name=post-content]')
    let accounts = await window.ethereum.enable()

    window._stele.isWeb3Actioning = true
    document.querySelector('button.web3-action').classList.add('disabled')

    if (window.hasMetamask && accounts.length > 0) {
      window._stele.Post.methods.Create(textArea.value).send({
        from: accounts[0]
      }).on('transactionHash', function (result) {
        window._stele.showToolTip('Post has already sent to blockchain, please wait for confirmation.')
        textArea.value = ''
      }).then(function (result) {
        window._stele.showToolTip('Post has already published!')
        window._stele.isWeb3Actioning = false
        document.querySelector('button.web3-action').classList.remove('disabled')
      })
    } else {
      window._stele.showToolTip('Please install metamask plugin')
    }
  }
}

window._stele.setUsername = async function () {
  if (!window._stele.isWeb3Actioning) {
    let inputArea = document.querySelector('input[name=username]')
    let accounts = await window.ethereum.enable()

    window._stele.isWeb3Actioning = true
    document.querySelector('button.web3-action').classList.add('disabled')

    if (window.hasMetamask && accounts.length > 0) {
      window._stele.Username.methods.Update(web3.utils.fromAscii(inputArea.value)).send({
        from: accounts[0]
      }).on('transactionHash', function (result) {
        window._stele.showToolTip('Username has already sent to blockchain, please wait for confirmation.')
      }).then(function (result) {
        window._stele.showToolTip('Username has already updated!')
        window._stele.isWeb3Actioning = false
        document.querySelector('button.web3-action').classList.remove('disabled')
      })
    } else {
      window._stele.showToolTip('Please install metamask plugin')
    }
  }
}

window._stele.setDescription = async function () {
  if (!window._stele.isWeb3Actioning) {
    let textArea = document.querySelector('textarea[name=description]')
    let accounts = await window.ethereum.enable()

    window._stele.isWeb3Actioning = true
    document.querySelector('button.web3-action').classList.add('disabled')

    if (window.hasMetamask && accounts.length > 0) {
      window._stele.Description.methods.Update(textArea.value).send({
        from: accounts[0]
      }).on('transactionHash', function (result) {
        window._stele.showToolTip('Desctiption has already sent to blockchain, please wait for confirmation.')
      }).then(function (result) {
        window._stele.showToolTip('Desctiption has already updated!')
        window._stele.isWeb3Actioning = false
        document.querySelector('button.web3-action').classList.remove('disabled')
      })
    } else {
      window._stele.showToolTip('Please install metamask plugin')
    }
  }
}

window._stele.startApp = async function () {
  const rpcUrl = 'https://mainnet.infura.io/v3/86955966e8f84fe2be3f95293a27aefe'

  // Check network status
  window.hasMetamask = false
  if (typeof web3 !== 'undefined') {
    window.oldWeb3 = web3
    window.web3 = new Web3(web3.currentProvider)
    let networkType = await window.web3.eth.net.getNetworkType()
    if (networkType === 'main') {
      window.hasMetamask = true
      window.web3 = new Web3(web3.currentProvider)
    }
  }
  if (!window.hasMetamask) {
    window.web3 = new Web3(new Web3.providers.HttpProvider(rpcUrl))
  }

  // Initialize web3 modules
  window._stele.Post = new window.web3.eth.Contract(JSON.parse(`[{"constant":false,"inputs":[{"name":"data","type":"string"}],"name":"Create","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"postIdx","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"anonymous":false,"inputs":[{"indexed":true,"name":"postIdx","type":"uint256"},{"indexed":true,"name":"creator","type":"address"},{"indexed":false,"name":"data","type":"string"}],"name":"Posted","type":"event"}]`), '0xEbfc4A31F0C1a8002398AE5601bE27c6a7ed35B7')
  window._stele.Username = new window.web3.eth.Contract(JSON.parse(`[{"constant":true,"inputs":[{"name":"","type":"bytes32"}],"name":"owner","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"","type":"address"}],"name":"username","outputs":[{"name":"","type":"bytes32"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_username","type":"bytes32"}],"name":"Update","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"anonymous":false,"inputs":[{"indexed":true,"name":"user","type":"address"},{"indexed":true,"name":"username","type":"bytes32"}],"name":"Updated","type":"event"}]`), '0x2581eDAf8Dd85bDE2a33AB9Ac5b190E7C7b0A1Ad')
  window._stele.Description = new window.web3.eth.Contract(JSON.parse(`[{"constant":true,"inputs":[{"name":"","type":"address"}],"name":"description","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"data","type":"string"}],"name":"Update","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"descriptionIdx","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"anonymous":false,"inputs":[{"indexed":true,"name":"descriptionIdx","type":"uint256"},{"indexed":true,"name":"creator","type":"address"},{"indexed":false,"name":"data","type":"string"}],"name":"Updated","type":"event"}]`), '0x56493824C70C429c155C7471BbC5ccb69562190b')

  // Initialize navbars
  document.querySelector('button[name="show-post-dialog"]').addEventListener('click', window._stele.showPostDialog)
  document.querySelector('button[name="close-post-dialog"]').addEventListener('click', window._stele.closePostDialog)
  document.querySelector('#post-dialog').addEventListener('click', window._stele.closePostDialog)
  document.querySelector('#post-dialog .popup').addEventListener('click', function (event) {
    event.stopPropagation()
  })
  document.querySelector('button[name="create-post"]').addEventListener('click', window._stele.createPost)
  document.querySelector('textarea[name="post-content"]').addEventListener('keydown', function (event) {
    if (event.which === 27) {
      window._stele.closePostDialog()
    }
  })

  window.dispatchEvent(new CustomEvent('coreLoaded'))
}

window.addEventListener('load', function () {
  if (typeof Web3 === 'undefined') {
    console.error('Web3 not installed')
    return
  }
  window._stele.startApp()
})
