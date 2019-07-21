window._xpost = {}
window._xpost.usernameCache = {}

window._xpost.getPostIdx = async function () {
  return window._xpost.Post.methods.postIdx().call().then(function (result) {
    return result - 1
  })
}

window._xpost.getUsername = async function (address) {
  if (address in window._xpost.usernameCache) {
    return window._xpost.usernameCache[address]
  }
  return window._xpost.Username.methods.username(address).call().then(function (result) {
    let username = window.web3.utils.toAscii(result.replace(/0+$/g, ''))
    window._xpost.usernameCache[address] = username
    return username
  })
}

window._xpost.getAddress = async function (username) {
  return window._xpost.Username.methods.owner(web3.utils.fromAscii(username)).call().then(function (result) {
    return result
  })
}

window._xpost.startLoadingCheck = async function startLoadingCheck (postIdx) {
  const pageSize = 10
  if (typeof postIdx === 'undefined') {
    postIdx = await window._xpost.getPostIdx()
  }

  if (window._xpost.pageShouldLoad) {
    if (postIdx >= 0) {
      await window._xpost.loadPage(postIdx, pageSize)
      postIdx -= pageSize
    }
    window._xpost.pageShouldLoad = false
  }
  setTimeout(function () { window._xpost.startLoadingCheck(postIdx) }, 100)
}

window._xpost.loadWithIdx = async function (idx) {
  window._xpost.Post.getPastEvents('Posted', {
    fromBlock: 8192055,
    filter: {
      postIdx: [idx]
    }
  }).then(async function (posts) {
    for (let i = posts.length - 1; i >= 0; i--) {
      await window._xpost.appendPost(posts[i])
    }
  })
}

window._xpost.loadPageWithUserAddress = async function (address) {
  window._xpost.Post.getPastEvents('Posted', {
    fromBlock: 8192055,
    filter: {
      creator: [address]
    }
  }).then(async function (posts) {
    for (let i = posts.length - 1; i >= 0; i--) {
      await window._xpost.appendPost(posts[i])
    }
  })
}

window._xpost.loadPage = async function (lastIdx, pageSize) {
  let postIdxList = []
  for (let i = 0; i < pageSize && lastIdx - i >= 0; i++) {
    postIdxList.push(lastIdx - i)
  }

  window._xpost.Post.getPastEvents('Posted', {
    fromBlock: 8192055,
    filter: {
      postIdx: postIdxList
    }
  }).then(async function (posts) {
    for (let i = posts.length - 1; i >= 0; i--) {
      await window._xpost.appendPost(posts[i])
    }
  })
}

window._xpost.appendPost = async function (post) {
  let timeline = document.querySelector('#post-timeline')
  let postBlock = document.createElement('div')
  postBlock.classList.add('post')

  let postInfo = document.createElement('div')
  postInfo.classList.add('post-info')

  let postNumberWrap = document.createElement('a')
  let postNumber = document.createElement('span')
  postNumber.classList.add('number')
  postNumber.textContent = `#${post.returnValues.postIdx} `
  postNumberWrap.href = `${window.location.protocol}//${window.location.host}/p${postNumber.textContent}`
  postNumberWrap.appendChild(postNumber)

  let postCreatorWrap = document.createElement('a')
  let postCreator = document.createElement('span')
  let userName = await window._xpost.getUsername(post.returnValues.creator)
  postCreator.classList.add('creator')
  postCreator.textContent = userName || post.returnValues.creator
  postCreatorWrap.href = `${window.location.protocol}//${window.location.host}/u#${postCreator.textContent}`
  postCreatorWrap.appendChild(postCreator)

  let postBlockHeight = document.createElement('span')
  postBlockHeight.classList.add('block-height')
  postBlockHeight.textContent = `- ${post.blockNumber}`

  postInfo.appendChild(postNumberWrap)
  postInfo.appendChild(postCreatorWrap)
  postInfo.appendChild(postBlockHeight)

  let postContent = document.createElement('div')
  postContent.classList.add('post-content')
  postContent.textContent = post.returnValues.data

  postBlock.appendChild(postInfo)
  postBlock.appendChild(postContent)

  timeline.appendChild(postBlock)
}

window._xpost.showPostDialog = async function () {
  document.querySelector('#post-dialog').style.display = 'flex'
  document.querySelector('body').classList.add('modal-opened')
}

window._xpost.closePostDialog = async function () {
  document.querySelector('#post-dialog').style.display = 'none'
  document.querySelector('body').classList.remove('modal-opened')
}

window._xpost.createPost = async function () {
  let textArea = document.querySelector('#post-content')
  let accounts = await window.ethereum.enable()
  if (window.hasMetamask && accounts.length > 0) {
    await window._xpost.Post.methods.Create(textArea.value).send({
      from: accounts[0]
    })
    // Clean text area after finish
    textArea.value = ''
  } else {
    window.alert('Please install metamask plugin')
  }
}

window._xpost.startApp = async function () {
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
  window._xpost.Post = new window.web3.eth.Contract(JSON.parse(`[{"constant":false,"inputs":[{"name":"data","type":"string"}],"name":"Create","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"postIdx","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"anonymous":false,"inputs":[{"indexed":true,"name":"postIdx","type":"uint256"},{"indexed":true,"name":"creator","type":"address"},{"indexed":false,"name":"data","type":"string"}],"name":"Posted","type":"event"}]`), '0xEbfc4A31F0C1a8002398AE5601bE27c6a7ed35B7')
  window._xpost.Username = new window.web3.eth.Contract(JSON.parse(`[{"constant":true,"inputs":[{"name":"","type":"bytes32"}],"name":"owner","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"","type":"address"}],"name":"username","outputs":[{"name":"","type":"bytes32"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_username","type":"bytes32"}],"name":"Update","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"anonymous":false,"inputs":[{"indexed":true,"name":"user","type":"address"},{"indexed":true,"name":"username","type":"bytes32"}],"name":"Updated","type":"event"}]`), '0x2581eDAf8Dd85bDE2a33AB9Ac5b190E7C7b0A1Ad')

  document.querySelector('#show-post-dialog').addEventListener('click', window._xpost.showPostDialog)
  document.querySelector('#close-post-dialog').addEventListener('click', window._xpost.closePostDialog)
  document.querySelector('#post-dialog').addEventListener('click', window._xpost.closePostDialog)
  document.querySelector('#post-dialog .popup').addEventListener('click', function (event) {
    event.stopPropagation()
  })
  document.querySelector('#create-post').addEventListener('click', window._xpost.createPost)

  window.dispatchEvent(new CustomEvent('coreLoaded'))
}

window.addEventListener('load', function () {
  if (typeof Web3 === 'undefined') {
    console.error('Web3 not installed')
    return
  }
  window._xpost.startApp()
})
