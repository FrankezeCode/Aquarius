import Navbar from "./navbar";
import Footer from "./footer";

interface ProtocolShellProps {
  children: React.ReactNode;
}

const ProtocolShell = ({ children }: ProtocolShellProps) => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 pt-16">{children}</main>
      <Footer />
    </div>
  );
};

export default ProtocolShell;
