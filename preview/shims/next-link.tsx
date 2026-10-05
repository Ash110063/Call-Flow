import { navigate } from "./router";

type Props = React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string };

export default function Link({ href, onClick, children, ...rest }: Props) {
  return (
    <a
      {...rest}
      href={`#${href}`}
      onClick={(e) => {
        onClick?.(e);
        if (e.defaultPrevented || e.metaKey || e.ctrlKey) return;
        e.preventDefault();
        navigate(href);
      }}
    >
      {children}
    </a>
  );
}
