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
  return window.Username.methods.usernames(address).call().then(function (result) {
    let username = window.web3.utils.toAscii(result.replace(/0+$/g, ''))
    usernameCache[address] = username
    return username
  })
}

async function loadPage (lastIdx, pageSize) {
  let postIdxList = []
  for (let i = 0; i < pageSize && lastIdx - i >= 0; i++) {
    postIdxList.push(lastIdx - i)
  }

  window.Post.getPastEvents('Posted', {
    fromBlock: 8179906,
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

async function startApp () {
  const rpcUrl = 'https://mainnet.infura.io/v3/86955966e8f84fe2be3f95293a27aefe'
  const pageSize = 10

  window.web3 = new Web3(new Web3.providers.HttpProvider(rpcUrl))
  window.Post = new window.web3.eth.Contract(JSON.parse(`[{"constant":true,"inputs":[],"name":"postIdx","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"data","type":"string"}],"name":"Post","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"anonymous":false,"inputs":[{"indexed":true,"name":"postIdx","type":"uint256"},{"indexed":true,"name":"creator","type":"address"},{"indexed":false,"name":"data","type":"string"}],"name":"Posted","type":"event"}]`), '0x8c5c4B00f4BBD5Bc664A3591c6B4A7a4bB893FF3')
  window.Username = new window.web3.eth.Contract(JSON.parse(`[{"constant":false,"inputs":[{"name":"_username","type":"bytes32"}],"name":"Set","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"","type":"bytes32"}],"name":"usernameUsed","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"","type":"address"}],"name":"usernames","outputs":[{"name":"","type":"bytes32"}],"payable":false,"stateMutability":"view","type":"function"},{"anonymous":false,"inputs":[{"indexed":true,"name":"user","type":"address"},{"indexed":false,"name":"username","type":"bytes32"}],"name":"UsernameSet","type":"event"}]`), '0x08647cf047537ca69cA7D73Dcd6697ab9d32DABb')

  let postIdx = await getPostIdx()

  await loadPage(postIdx, pageSize)
  postIdx -= pageSize

  window.addEventListener('scroll', async function(event) {
    if (document.documentElement.scrollHeight - event.pageY < document.documentElement.clientHeight * 2 && postIdx >= 0) {
      await loadPage(postIdx, pageSize)
      postIdx -= pageSize
    }
  })
}

window.addEventListener('load', function () {
  if (typeof Web3 === 'undefined') {
    console.error('Web3 not installed')
    return
  }
  startApp()
})
