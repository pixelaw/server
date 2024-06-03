import { createClient } from '../lib/graphql'
import { gql } from 'graphql-tag'

const QUERY_ADDRESSES = gql`
  query CombinedQuery {
    coreActionsAddressModels {
      edges {
        node {
          key
          value
        }
      }
    }
    metadatas(first: 1) {
      edges {
        node {
          worldAddress
        }
      }
    }
  }
`
type ResultType = {
  data: {
    coreActionsAddressModels: {
      edges: {
        node: {
          key: string
          value: string
        }
      }[]
    }
    metadatas: {
      edges: {
        node: {
          worldAddress: string
        }
      }[]
    }
  }
}

export const getAddresses = async (toriiUrl: string) => {
  const client = createClient(`${toriiUrl}/graphql`)
  const {
    data: {
      metadatas: { edges: [{ node: { worldAddress }}]},
      coreActionsAddressModels: { edges: [{ node: { key, value: coreAddress }}]}
    }
  }: ResultType =  await client.query({
    query: QUERY_ADDRESSES
  })
  if (!worldAddress || !coreAddress) throw new Error('Metadata has not been initialized')
  return { worldAddress, coreAddress }
}

