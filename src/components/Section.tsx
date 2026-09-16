import Link from 'next/link';
export function Section({title,href,children}:{title:string;href?:string;children:React.ReactNode}){return <section className="space-y-4"><div className="section-head"><div><span className="section-dot"/><h2>{title}</h2></div>{href&&<Link href={href}>View all <span>›</span></Link>}</div>{children}</section>}
