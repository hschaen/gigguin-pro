import Link from "next/link";

export default function Footer() {
  const footerLinks = [
    { href: "/", label: "Book DJ" },
    { href: "/asset-generator", label: "Asset Generator" },
    { href: "/admin/djs", label: "Manage DJs" },
    { href: "/admin/bookings", label: "View Bookings" },
  ];

  return (
    <footer className="bg-gray-50 border-t">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col items-center space-y-4">
          {/* Links */}
          <div className="flex flex-wrap justify-center gap-4 text-sm">
            {footerLinks.map((link, index) => (
              <div key={link.href} className="flex items-center">
                <Link
                  href={link.href}
                  className="text-gray-600 hover:text-gray-900 transition-colors"
                >
                  {link.label}
                </Link>
                {index < footerLinks.length - 1 && (
                  <span className="ml-4 text-gray-400">|</span>
                )}
              </div>
            ))}
          </div>
          
          {/* Site Name */}
          <div className="text-center">
            <p className="text-sm text-gray-500">
              © 2024 DJ Booking Tool. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}