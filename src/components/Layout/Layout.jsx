import Navbar from './Navbar';
import Footer from './Footer';

const Layout = ({ children, darkNav = false, blueNav = false }) => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar dark={darkNav} blue={blueNav} />
      <main className="flex-grow">{children}</main>
      <Footer />
    </div>
  );
};

export default Layout;
