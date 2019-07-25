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

window._stele.enableWeb3Action = function () {
  window._stele.isWeb3Actioning = false
  document.querySelectorAll('button.web3-action').forEach(function (element) {
    element.disabled = false
  })
}

window._stele.disableWeb3Action = function () {
  window._stele.isWeb3Actioning = true
  document.querySelectorAll('button.web3-action').forEach(function (element) {
    element.disabled = true
  })
}

window._stele.showToolTip = async function (message, time = 5000) {
  let tooltip = document.querySelector('#tooltip')
  tooltip.textContent = message
  tooltip.classList.add('show')
  window._stele.tooltipShowUntil = (new Date()).getTime() + time
  setTimeout(function () {
    if ((new Date()).getTime() >= window._stele.tooltipShowUntil) {
      tooltip.classList.remove('show')
    }
  }, time + 500)
}

window._stele.showNotFound = async function (message) {
  document.querySelector('#not-found .message').textContent = message
  document.querySelector('#not-found').style.display = 'block'
}

window._stele.getPostCount = async function () {
  return window._stele.Post.methods.postIdx().call().then(function (result) {
    return parseInt(result) - 1
  })
}

window._stele.getUsername = async function (address) {
  if (address in window._stele.usernameCache) {
    return window._stele.usernameCache[address]
  }
  return window._stele.Username.methods.getUsername(address).call().then(function (result) {
    window._stele.usernameCache[address] = result
    return result
  })
}

window._stele.getAddress = async function (username) {
  return window._stele.Username.methods.getOwner(username).call()
}

window._stele.getPostLikeStatus = async function (postIdxList) {
  let address = '0x0'
  if (window.hasMetamask) {
      let accounts = await window.ethereum.enable()
      if (accounts.length > 0) {
        address = accounts[0]
      }
  }
  return window._stele.GetPostLike.methods.get(postIdxList, address).call().then(function (results) {
    let status = {}
    for (let i = 0; i < postIdxList.length; i++) {
      status[postIdxList[i]] = {
        likeCount: parseInt(results[i]),
        liked: parseInt(results[i + postIdxList.length]) === 1
      }
    }
    return status
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
    if (posts.length > 0) {
      let likeStatus = await window._stele.getPostLikeStatus([idx])
      await window._stele.appendPost(posts[0], {
        likeCount: likeStatus[idx].likeCount,
        liked: likeStatus[idx].liked
      })
    } else {
      window._stele.showNotFound(`Post ${idx} not exists!`)
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
    let postIdxList = []
    for (let i = 0; i < posts.length; i++) {
      postIdxList.push(parseInt(posts[i].returnValues.postIdx))
    }
    let likeStatus = await window._stele.getPostLikeStatus(postIdxList)
    for (let i = posts.length - 1; i >= 0; i--) {
      let postIdx = parseInt(posts[i].returnValues.postIdx)
      await window._stele.appendPost(posts[i], {
        likeCount: likeStatus[postIdx].likeCount,
        liked: likeStatus[postIdx].liked
      })
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
    let likeStatus = await window._stele.getPostLikeStatus(postIdxList)
    for (let i = posts.length - 1; i >= 0; i--) {
      let postIdx = parseInt(posts[i].returnValues.postIdx)
      let context = {
        likeCount: likeStatus[postIdx].likeCount,
        liked: likeStatus[postIdx].liked
      }
      await window._stele.appendPost(posts[i], context)
    }
  })
}

window._stele.appendPost = async function (post, context) {
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
  likeButton.textContent = `${context.liked ? 'Liked' : 'Like'} ${context.likeCount}`
  likeButton.classList.add('lite')
  likeButton.addEventListener('click', function () { window._stele.likePost(post.returnValues.postIdx) })

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
  postFooter.appendChild(likeButton)
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
  document.body.classList.add('modal-opened')
}

window._stele.closePostDialog = async function () {
  document.querySelector('#post-dialog').style.display = 'none'
  document.body.classList.remove('modal-opened')
}

window._stele.callWeb3Cation = async function (executeFunc, sentCallBackFunc, messages) {
  if (!window._stele.isWeb3Actioning) {
    let accounts = await window.ethereum.enable()
    window._stele.disableWeb3Action()

    if (window.hasMetamask && accounts.length > 0) {
      executeFunc().send({
        from: accounts[0]
      }).on('transactionHash', function (result) {
        sentCallBackFunc()
        window._stele.closePostDialog()
        window._stele.showToolTip(messages.sent)
      }).then(function (result) {
        window._stele.showToolTip(messages.finished)
        window._stele.enableWeb3Action()
      }).catch(function (error) {
        let message
        if (error.message.includes('User denied transaction signature')) {
          message = messages.canceled
        } else {
          message = messages.error
        }
        window._stele.closePostDialog()
        window._stele.showToolTip(message)
        window._stele.enableWeb3Action()
      })
    } else {
      window._stele.showToolTip('Please install metamask plugin')
    }
  }
}

window._stele.createPost = async function () {
  let textArea = document.querySelector('textarea[name=post-content]')
  let executeFunc = function () {
    return window._stele.Post.methods.Create(textArea.value)
  }
  let sentCallBackFunc = function () {
    textArea.value = ''
  }
  window._stele.callWeb3Cation(executeFunc, sentCallBackFunc, {
    sent: 'Post has already sent to the blockchain. Please wait for confirmation.',
    finished: 'Post has already published!',
    canceled: 'Post canceled!',
    error: 'Post sent failed. Please reload the page or check your metamask.'
  })
}

window._stele.setUsername = async function () {
  let executeFunc = function () {
    let inputArea = document.querySelector('input[name=username]')
    return window._stele.Username.methods.update(inputArea.value)
  }
  window._stele.callWeb3Cation(executeFunc, function () {}, {
    sent: 'Username has already sent to the blockchain. Please wait for confirmation.',
    finished: 'Username has already updated!',
    canceled: 'Update canceled!',
    error: 'Username set failed. Please reload the page or check your metamask.'
  })
}

window._stele.setDescription = async function () {
  let executeFunc = function () {
    let textArea = document.querySelector('textarea[name=description]')
    return window._stele.Description.methods.Update(textArea.value)
  }
  window._stele.callWeb3Cation(executeFunc, function () {}, {
    sent: 'Desctiption has already sent to the blockchain. Please wait for confirmation.',
    finished: 'Desctiption has already updated!',
    canceled: 'Update canceled!',
    error: 'Description set failed. Please reload the page or check your metamask.'
  })
}

window._stele.likePost = async function (postIdx) {
  if (!window.hasMetamask) {
    window._stele.showToolTip('Please install Metamask to like the post!')
    return
  }
  let executeFunc = function () {
    return window._stele.PostLike.methods.Like(postIdx)
  }
  let sentCallBackFunc = function () {}
  window._stele.callWeb3Cation(executeFunc, sentCallBackFunc, {
    sent: 'Like has already sent to the blockchain. Please wait for confirmation.',
    finished: 'Like has already published!',
    canceled: 'Like canceled!',
    error: 'Like sent failed. Please reload the page or check your metamask.'
  })
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
    document.querySelector('button[name="show-post-dialog"]').style.display = 'none'
  }

  // Initialize web3 modules
  // web3 model contracts
  window._stele.Post = new window.web3.eth.Contract(JSON.parse(`[{"constant":false,"inputs":[{"name":"data","type":"string"}],"name":"Create","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"postIdx","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"anonymous":false,"inputs":[{"indexed":true,"name":"postIdx","type":"uint256"},{"indexed":true,"name":"creator","type":"address"},{"indexed":false,"name":"data","type":"string"}],"name":"Posted","type":"event"}]`), '0xEbfc4A31F0C1a8002398AE5601bE27c6a7ed35B7')
  window._stele.Username = new window.web3.eth.Contract(JSON.parse(`[{"constant":true,"inputs":[{"name":"","type":"address"}],"name":"username","outputs":[{"name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_username","type":"string"}],"name":"update","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"username","type":"string"}],"name":"getOwner","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"version","outputs":[{"name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"","type":"string"}],"name":"caseMap","outputs":[{"name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"str","type":"string"}],"name":"toLower","outputs":[{"name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"addr","type":"address"}],"name":"getUsername","outputs":[{"name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"str","type":"string"}],"name":"validate","outputs":[{"name":"result","type":"bool"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"","type":"string"}],"name":"owner","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"anonymous":false,"inputs":[{"indexed":true,"name":"user","type":"address"},{"indexed":true,"name":"username","type":"string"}],"name":"Updated","type":"event"}]`), '0x7Ab7bc59676c679cBf0bf8A23454fC3c339B5427')
  window._stele.Description = new window.web3.eth.Contract(JSON.parse(`[{"constant":true,"inputs":[{"name":"","type":"address"}],"name":"description","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"data","type":"string"}],"name":"Update","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"descriptionIdx","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"anonymous":false,"inputs":[{"indexed":true,"name":"descriptionIdx","type":"uint256"},{"indexed":true,"name":"creator","type":"address"},{"indexed":false,"name":"data","type":"string"}],"name":"Updated","type":"event"}]`), '0x56493824C70C429c155C7471BbC5ccb69562190b')
  window._stele.PostLike = new window.web3.eth.Contract(JSON.parse(`[{"constant":true,"inputs":[{"name":"","type":"address"},{"name":"","type":"uint256"}],"name":"liked","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"postIdx","type":"uint256"}],"name":"Like","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"postIdx","type":"uint256"}],"name":"Unlike","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"","type":"uint256"}],"name":"postLikeCount","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"anonymous":false,"inputs":[{"indexed":true,"name":"postIdx","type":"uint256"},{"indexed":true,"name":"user","type":"address"}],"name":"Liked","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"postIdx","type":"uint256"},{"indexed":true,"name":"user","type":"address"}],"name":"Unliked","type":"event"}]`), '0x2E8c1E33e82E2A5b93076f32Aa5EFE3dFaAa1676')

  // web3 method contracts
  window._stele.GetPostLike = new window.web3.eth.Contract(JSON.parse(`[{"constant":true,"inputs":[{"name":"postIdxList","type":"uint256[]"},{"name":"user","type":"address"}],"name":"get","outputs":[{"name":"counts","type":"uint256[]"}],"payable":false,"stateMutability":"view","type":"function"}]`), '0x69955cDFb003fFC3EC655ffE046c41a9cBd82445')

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
