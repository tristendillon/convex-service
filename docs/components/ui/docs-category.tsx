import { source } from '@/lib/source'
import { getPageTreePeers } from 'fumadocs-core/server'
import { Card, Cards } from 'fumadocs-ui/components/card'

export function DocsCategory({ url }: { url: string }) {
  return (
    <Cards>
      {getPageTreePeers(source.pageTree, url).map((peer) => (
        <Card key={peer.url} title={peer.name} href={peer.url}>
          {peer.description}
        </Card>
      ))}
    </Cards>
  )
}
