import { gql } from "graphql-tag"
import { createClient } from "../lib/graphql"

const QUERY_ADDRESSES = gql`
  query CombinedQuery {
    pixelawCoreActionsAddressModels {
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
        pixelawCoreActionsAddressModels: {
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
export const getCoreActionsAddresses = async (toriiUrl: string) => {
    const client = createClient(`${toriiUrl}/graphql`)
    const {
        data: {
            pixelawCoreActionsAddressModels: {
                edges: [
                    {
                        node: { key, value: coreAddress },
                    },
                ],
            },
        },
    }: ResultType = await client.query({
        query: QUERY_ADDRESSES,
    })
    if (!coreAddress) throw new Error("coreAddress has not been initialized")
    return { coreAddress }
}

export const getAddresses = async (toriiUrl: string) => {
    const client = createClient(`${toriiUrl}/graphql`)
    const {
        data: {
            metadatas: {
                edges: [
                    {
                        node: { worldAddress },
                    },
                ],
            },
            pixelawCoreActionsAddressModels: {
                edges: [
                    {
                        node: { key, value: coreAddress },
                    },
                ],
            },
        },
    }: ResultType = await client.query({
        query: QUERY_ADDRESSES,
    })
    if (!worldAddress || !coreAddress) throw new Error("Metadata has not been initialized")
    return { worldAddress, coreAddress }
}
