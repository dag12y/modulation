import katex from 'katex';
export function Equation({
  math,
  block = false,
}: {
  math: string;
  block?: boolean;
}) {
  return (
    <span
      className={block ? 'equation equation-block' : 'equation'}
      dangerouslySetInnerHTML={{
        __html: katex.renderToString(math, {
          throwOnError: false,
          displayMode: block,
          output: 'htmlAndMathml',
          trust: false,
        }),
      }}
    />
  );
}
