import { store, Address, Bytes, BigInt, BigDecimal } from '@graphprotocol/graph-ts';
import {NameChanged, GSNPlaygroundContract} from '../generated/GSNPlayground/GSNPlaygroundContract';
import {NamedEntity} from '../generated/schema'
import { log } from '@graphprotocol/graph-ts';

let zeroAddress = '0x0000000000000000000000000000000000000000';

export function handleNameChanged(event: NameChanged): void {
    let id = event.params.user.toHex();
    let entity = NamedEntity.load(id);
    if (!entity) {
        entity = new NamedEntity(id);
    }
    entity.name = event.params.name;
    entity.save();   
}