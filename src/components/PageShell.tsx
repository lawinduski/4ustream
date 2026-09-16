import { Header } from './Header';
export function PageShell({children}:{children:React.ReactNode}){return <><div className="animated-bg" aria-hidden="true"><span className="orb one"/><span className="orb two"/></div><Header/><main className="site-main">{children}</main><footer className="site-footer">© {new Date().getFullYear()} 4uStream · Built for authorized content.</footer></>}
