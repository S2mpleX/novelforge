import React, { useRef } from 'react';
import { LayoutNode } from '@/types/docking';
import { TabGroup } from './TabGroup';
import { Splitter } from './Splitter';

interface Props {
  node: LayoutNode;
}

export const LayoutRenderer: React.FC<Props> = ({ node }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);

  if (node.type === 'tabs') {
    return <TabGroup node={node} />;
  }

  const isHorizontal = node.orientation === 'horizontal';

  return (
    <div
      ref={containerRef}
      className={`w-full h-full flex ${
        isHorizontal ? 'flex-row' : 'flex-col'
      } overflow-hidden relative select-none`}
    >
      {node.children.map((child, i) => {
        const sizePercent = node.sizes[i] || 100 / node.children.length;
        const isLast = i === node.children.length - 1;

        return (
          <React.Fragment key={child.id}>
            <div
              style={{
                flex: `${sizePercent} 1 0%`,
                minWidth: isHorizontal ? 120 : 0,
                minHeight: isHorizontal ? 0 : 100,
              }}
              className="overflow-hidden flex flex-col relative"
            >
              <LayoutRenderer node={child} />
            </div>

            {!isLast && (
              <Splitter
                splitId={node.id}
                orientation={node.orientation}
                index={i}
                sizes={node.sizes}
                containerRef={containerRef}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};
