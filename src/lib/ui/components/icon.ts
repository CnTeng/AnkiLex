import type { IconNode, SVGProps } from "lucide";

const defaultAttributes: SVGProps = {
  xmlns: "http://www.w3.org/2000/svg",
  width: 24,
  height: 24,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  "stroke-width": 2,
  "stroke-linecap": "round",
  "stroke-linejoin": "round",
};

type CreateSVGElementParams = [tag: string, attrs: SVGProps, children?: IconNode];

const createSVGElement = (doc: Document, [tag, attrs, children]: CreateSVGElementParams) => {
  const element = doc.createElementNS("http://www.w3.org/2000/svg", tag);

  Object.keys(attrs).forEach((name) => {
    element.setAttribute(name, String(attrs[name]));
  });

  if (children?.length) {
    children.forEach((child) => {
      const childElement = createSVGElement(doc, child);

      element.append(childElement);
    });
  }

  return element;
};

export const Icon = ({
  doc = document,
  iconNode,
  customAttrs,
}: {
  doc?: Document;
  iconNode: IconNode;
  customAttrs?: SVGProps;
}): SVGElement => {
  const tag = "svg";
  const attrs = {
    ...defaultAttributes,
    ...customAttrs,
  };

  return createSVGElement(doc, [tag, attrs, iconNode]);
};
