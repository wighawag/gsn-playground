// TODO load portis dynamically from cdn //
/*
<script
  src="https://cdn.jsdelivr.net/npm/@portis/web3@2.0.0-beta.2.0.0-beta.49/umd/index.js"
  integrity="sha256-eVldFSMA1ifYTEJo1QXYPK7v+V+CNCEP4Xsp5/aAVQ8="
  crossorigin="anonymous"
></script>
*/

let Portis;

function PortisModule({dappId, config, forceFallbackUrl, fallbackUrl, chainId}) {
    this.dappId = dappId;
    this.config = config;
    this.forceFallbackUrl = forceFallbackUrl;
    this.id = 'portis';
    this.fallbackUrl = fallbackUrl;
    this.chainId = chainId;
}

const knownChainIds = {
    '1': 'mainnet',
    '3': 'ropsten',
    '4': 'rinkeby',
    '5': 'goerli',
    '8': 'ubiq',
    '18': 'thundercoreTestnet',
    // TODO chainId '': 'orchid',
    // TODO chainId '': 'orchidTestnet',
    '42': 'kovan',
    '61': 'classic',
    '77': 'sokol',
    '99': 'core',
    '100': 'xdai',
    '108': 'thundercore',
    // TODO chainId '': 'fuse',
    '163': 'lightstreams',
    // TODO chainId '': 'maticAlpha',
    // TODO chainId '': 'maticTestnet' // is that testnet3 ?
}

PortisModule.prototype.setup = async function(config) {
    config = config || {};
    let {chainId, fallbackUrl} = config;
    Portis = require('@portis/web3').default;
    // console.log({Portis})
    chainId = chainId || this.chainId;
    fallbackUrl = fallbackUrl || this.fallbackUrl;
    
    const portisChainId = (chainId && ("" + chainId).slice(0,2) == "0x") ? parseInt(chainId.slice(2), 16) : chainId;
    
    let network;
    if (!this.forceFallbackUrl) {
        network = knownChainIds[portisChainId];
    }
    
    if (!network && fallbackUrl) {
        network = {
            nodeUrl: fallbackUrl,
            chainId: portisChainId,
        };
        console.log('PORTIS with ' + network.nodeUrl + ' ' + chainId);
    }
    if (!network) {
        throw new Error('chain ' + portisChainId + ' (' + chainId  + ') not supported by portis');
    }
    this.portis = new Portis(this.dappId, network, this.config);
    window.portis = this.portis;
    this.portis.onError((error) => {
        console.error('PORTIS ERROR:');
        console.error(error);
    });
    this.portis.onActiveWalletChanged((walletAddress) => {
        console.log('PORTIS address: ' + walletAddress);
    });
    this.portis.onLogout(() => {
        console.log('PORTIS logout ');
    });
    this.portis.onLogin((walletAddress, email, reputation) => {
        console.log('PORTIS login: ' + walletAddress + ',' + email);
    });
    return {
        web3Provider: this.portis.provider,
        chainId
    };
}

PortisModule.prototype.logout = async function() {
    return this.portis.logout();
}

PortisModule.prototype.isLoggedIn = async function() {
    return this.portis.isLoggedIn();
}

PortisModule.prototype.onAccountsChanged = function(f) { // TODO ability remove listener ?
    this.portis.onActiveWalletChanged((newAddress) => {
        f([newAddress]);
    });
}

// TODO onError / onLogin / onLogout
// probably not necessary : onActiveWalletChanged

module.exports = PortisModule;
