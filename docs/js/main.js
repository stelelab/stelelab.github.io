async function getPostIdx (contract) {
  return contract.methods.postIdx().call().then(function (result) {
    return result
  })
}

async function loadPage (contract, lastIdx) {
  let postIdxList = []
  for (let i = 0; i < 10 && lastIdx - i >= 0; i++) {
    postIdxList.push(lastIdx - i)
  }
  contract.getPastEvents('Posted', {
    fromBlock: 8179906,
    filter: {
      postIdx: postIdxList
    }
  }).then(function (posts) {
    posts = posts.reverse()
    posts.forEach(function (post) {
      appendPost(post)
    })
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
  postCreator.classList.add('creator')
  postCreator.textContent = post.returnValues.creator

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
  const web3 = new Web3(new Web3.providers.HttpProvider(rpcUrl))

  const address = '0x8c5c4B00f4BBD5Bc664A3591c6B4A7a4bB893FF3'
  const abi = JSON.parse(`[{"constant":true,"inputs":[],"name":"postIdx","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"data","type":"string"}],"name":"Post","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"anonymous":false,"inputs":[{"indexed":true,"name":"postIdx","type":"uint256"},{"indexed":true,"name":"creator","type":"address"},{"indexed":false,"name":"data","type":"string"}],"name":"Posted","type":"event"}]`)
  const contract = new web3.eth.Contract(abi, address)

  let postIdx = await getPostIdx(contract)

  loadPage(contract, postIdx)
}

window.addEventListener('load', function () {
  if (typeof Web3 === 'undefined') {
    console.error('Web3 not installed')
    return
  }
  startApp()
})
