<!--   -->

## Requirements
- node/npm
- yarn
- docker/docker-compose

## SETUP

```
yarn
```

## START

```
yarn shell:dev
```

This will launch
- a graph-node (https://thegraph.com)
- an ethereum node on localhost:8545
- a webapp on localhost:3000
- a gsn relayer (with the relevant contracts deployed (relayhub, forwarder...)

Plus it will deploy the contract and a subgraph

