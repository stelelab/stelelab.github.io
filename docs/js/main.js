let usernameCache = {}

async function getPostIdx () {
  return window.Post.methods.postIdx().call().then(function (result) {
    return result - 1
  })
}

async function getUsername (address) {
  if (address in usernameCache) {
    return usernameCache[address]
  }
  return window.Username.methods.username(address).call().then(function (result) {
    let username = window.web3.utils.toAscii(result.replace(/0+$/g, ''))
    usernameCache[address] = username
    return username
  })
}

async function startLoadingCheck (postIdx) {
  const pageSize = 10

  if (window.pageShouldLoad) {
    if (postIdx >= 0) {
      await loadPage(postIdx, pageSize)
      postIdx -= pageSize
    }
    window.pageShouldLoad = false
  }
  setTimeout(startLoadingCheck, 100)
}

async function loadPage (lastIdx, pageSize) {
  let postIdxList = []
  for (let i = 0; i < pageSize && lastIdx - i >= 0; i++) {
    postIdxList.push(lastIdx - i)
  }

  window.Post.getPastEvents('Posted', {
    fromBlock: 8192055,
    filter: {
      postIdx: postIdxList
    }
  }).then(async function (posts) {
    for (let i = posts.length - 1; i >= 0; i--) {
      await appendPost(posts[i])
    }
  })
}

async function appendPost (post) {
  let timeline = document.querySelector('#post-timeline')
  let postBlock = document.createElement('div')
  postBlock.classList.add('post')

  let postInfo = document.createElement('div')
  postInfo.classList.add('post-info')

  let postNumber = document.createElement('span')
  postNumber.classList.add('number')
  postNumber.textContent = `#${post.returnValues.postIdx}`

  let postCreator = document.createElement('span')
  let userName = await getUsername(post.returnValues.creator)
  postCreator.classList.add('creator')
  postCreator.textContent = userName? userName : post.returnValues.creator

  let postBlockHeight = document.createElement('span')
  postBlockHeight.classList.add('block-height')
  postBlockHeight.textContent = `- ${post.blockNumber}`

  postInfo.appendChild(postNumber)
  postInfo.appendChild(postCreator)
  postInfo.appendChild(postBlockHeight)

  let postContent = document.createElement('div')
  postContent.classList.add('post-content')
  postContent.textContent = post.returnValues.data

  postBlock.appendChild(postInfo)
  postBlock.appendChild(postContent)

  timeline.appendChild(postBlock)
}

async function showPostDialog () {
  document.querySelector('#post-dialog').style.display = 'flex'
  document.querySelector('body').classList.add('modal-opened')
}

async function closePostDialog () {
  document.querySelector('#post-dialog').style.display = 'none'
  document.querySelector('body').classList.remove('modal-opened')
}

async function createPost () {
  let textArea = document.querySelector('#post-content')
  let accounts = await window.ethereum.enable()
  if (window.hasMetamask && accounts.length > 0) {
    await window.Post.methods.Create(textArea.value).send({
      from: accounts[0]
    })
    // Clean text area after finish
    textArea.value = ''
  } else {
    alert('Please install metamask plugin')
  }
}

async function startApp () {
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
  window.Post = new window.web3.eth.Contract(JSON.parse(`[{"constant":false,"inputs":[{"name":"data","type":"string"}],"name":"Create","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"postIdx","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"anonymous":false,"inputs":[{"indexed":true,"name":"postIdx","type":"uint256"},{"indexed":true,"name":"creator","type":"address"},{"indexed":false,"name":"data","type":"string"}],"name":"Posted","type":"event"}]`), '0xEbfc4A31F0C1a8002398AE5601bE27c6a7ed35B7')
  window.Username = new window.web3.eth.Contract(JSON.parse(`[{"constant":true,"inputs":[{"name":"","type":"address"}],"name":"username","outputs":[{"name":"","type":"bytes32"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_username","type":"bytes32"}],"name":"Update","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"","type":"bytes32"}],"name":"used","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"view","type":"function"},{"anonymous":false,"inputs":[{"indexed":true,"name":"user","type":"address"},{"indexed":false,"name":"username","type":"bytes32"}],"name":"Updated","type":"event"}]`), '0xf35974226f5A7464D1B39AF1c11a3e2109e7C694')

  window.pageShouldLoad = true

  let postIdx = await getPostIdx()
  startLoadingCheck(postIdx)

  window.addEventListener('scroll', async function(event) {
    if (document.documentElement.scrollHeight - event.pageY < document.documentElement.clientHeight * 2) {
      window.pageShouldLoad = true
    }
  })

  document.querySelector('#show-post-dialog').addEventListener('click', showPostDialog)
  document.querySelector('#close-post-dialog').addEventListener('click', closePostDialog)
  document.querySelector('#post-dialog').addEventListener('click', closePostDialog)
  document.querySelector('#post-dialog .popup').addEventListener('click', function (event) {
    event.stopPropagation()
  })
  document.querySelector('#create-post').addEventListener('click', createPost)
}

window.addEventListener('load', function () {
  if (typeof Web3 === 'undefined') {
    console.error('Web3 not installed')
    return
  }
  startApp()
})
