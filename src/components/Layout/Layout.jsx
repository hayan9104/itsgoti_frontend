import Navbar from './Navbar';
import Footer from './Footer';
import useWindowSize from '../../hooks/useWindowSize';

const Layout = ({ children, darkNav = false, blueNav = false, orangeNav = false }) => {
  const { isMobile } = useWindowSize();
  const navHeight = isMobile ? 64 : 80;

  return (
    <>
      {/* Fixed Navbar - completely outside any wrapper */}
      <Navbar dark={darkNav} blue={blueNav} orange={orangeNav} />

      {/* Page content with padding for fixed navbar */}
      <main style={{ paddingTop: `${navHeight}px`, minHeight: '100vh' }}>
        {children}
      </main>

      <Footer />
    </>
  );
};

export default Layout;
