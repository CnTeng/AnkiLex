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

export type IconOptions = {
  doc?: Document;
  iconNode: IconNode;
  className?: string;
  customAttrs?: SVGProps;
};

export class Icon {
  readonly element: SVGElement;

  private readonly doc: Document;

  constructor({ doc = document, iconNode, className, customAttrs }: IconOptions) {
    this.doc = doc;

    const attrs: SVGProps = {
      ...defaultAttributes,
      ...customAttrs,
    };

    if (className) attrs.class = className;

    this.element = this.createSVGElement(["svg", attrs, iconNode]);
  }

  private applyAttributes(element: Element, attrs: SVGProps) {
    Object.keys(attrs).forEach((name) => {
      element.setAttribute(name, String(attrs[name]));
    });
  }

  private createSVGElement([tag, attrs, children]: CreateSVGElementParams) {
    const element = this.doc.createElementNS("http://www.w3.org/2000/svg", tag);

    this.applyAttributes(element, attrs);

    if (children?.length) {
      children.forEach((child) => {
        element.append(this.createSVGElement(child));
      });
    }

    return element;
  }
}
