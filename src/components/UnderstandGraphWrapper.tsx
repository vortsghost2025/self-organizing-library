'use client';

import dynamic from 'next/dynamic';
import type { ComponentProps } from 'react';

const NexusGraph = dynamic(() => import('@/components/NexusGraph'), { ssr: false });

export default function UnderstandGraphWrapper(props: ComponentProps<typeof NexusGraph>) {
  return <NexusGraph {...props} />;
}
