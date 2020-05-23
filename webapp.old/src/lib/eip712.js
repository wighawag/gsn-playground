import {TypedDataUtils} from 'eth-sig-util';

export class EIP712Signer {
  
  constructor({types, domain, primaryType}) {
    this.types = types,
    this.domain = domain;
    this.primaryType = primaryType;
  }

  hash(message) {
    return '0x' + TypedDataUtils.sign({
      types: this.types,
      domain: this.domain,
      primaryType: this.primaryType,
      message
    }).toString('hex');
  }
}
