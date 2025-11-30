import { MessageSquare, Github, Twitter, Linkedin, Mail, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[#1a1f2e] border-t border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Section */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center border border-blue-600/30">
                <MessageSquare className="w-6 h-6 text-primary" />
              </div>
              <span className="text-xl font-bold text-white">Chatty</span>
            </div>
            <p className="text-gray-400 text-sm mb-4 max-w-md">
              Connect with friends and family through secure, real-time messaging. Share moments,
              stay connected, and chat effortlessly.
            </p>
            <div className="flex gap-4">
              <a
                href="https://github.com/Pritam-nitj"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-lg bg-[#2d3748] hover:bg-[#3d4758] flex items-center justify-center text-gray-400 hover:text-blue-500 transition-all duration-200"
              >
                <Github className="w-5 h-5" />
              </a>
              <a
                href="https://x.com/PritamK38448085"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-lg bg-[#2d3748] hover:bg-[#3d4758] flex items-center justify-center text-gray-400 hover:text-blue-500 transition-all duration-200"
              >
                <Twitter className="w-5 h-5" />
              </a>
              <a
                href="https://www.linkedin.com/in/pritam-nitj/"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-lg bg-[#2d3748] hover:bg-[#3d4758] flex items-center justify-center text-gray-400 hover:text-blue-500 transition-all duration-200"
              >
                <Linkedin className="w-5 h-5" />
              </a>
              <a
                href="mailto:pritamk6284987295@gmail.com"
                className="w-9 h-9 rounded-lg bg-[#2d3748] hover:bg-[#3d4758] flex items-center justify-center text-gray-400 hover:text-blue-500 transition-all duration-200"
              >
                <Mail className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  to="/about"
                  className="text-gray-400 hover:text-blue-500 text-sm transition-colors duration-200"
                >
                  About Us
                </Link>
              </li>
              <li>
                <Link
                  to="/features"
                  className="text-gray-400 hover:text-blue-500 text-sm transition-colors duration-200"
                >
                  Features
                </Link>
              </li>
              <li>
                <Link
                  to="/pricing"
                  className="text-gray-400 hover:text-blue-500 text-sm transition-colors duration-200"
                >
                  Pricing
                </Link>
              </li>
              <li>
                <Link
                  to="/contact"
                  className="text-gray-400 hover:text-blue-500 text-sm transition-colors duration-200"
                >
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-white font-semibold mb-4">Legal</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  to="/privacy"
                  className="text-gray-400 hover:text-blue-500 text-sm transition-colors duration-200"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  to="/terms"
                  className="text-gray-400 hover:text-blue-500 text-sm transition-colors duration-200"
                >
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link
                  to="/cookies"
                  className="text-gray-400 hover:text-blue-500 text-sm transition-colors duration-200"
                >
                  Cookie Policy
                </Link>
              </li>
              <li>
                <Link
                  to="/support"
                  className="text-gray-400 hover:text-blue-500 text-sm transition-colors duration-200"
                >
                  Support
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-8 pt-6 border-t border-gray-800">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-400 text-sm text-center md:text-left">
              © {currentYear} DarkWorld. All rights reserved.
            </p>
            <p className="text-gray-400 text-sm flex items-center gap-1">
              Develop <Heart className="w-4 h-4 text-blue-500 fill-blue-500" /> by Rimon Dutta
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
