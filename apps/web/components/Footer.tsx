import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-100 mt-20">
      <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <Link
              href="/"
              className="text-xl font-bold text-primary flex items-center gap-2"
            >
              <span className="bg-accent rounded-full p-1">🍌</span>
              Bananasbindery
            </Link>
            <p className="mt-4 text-gray-500 max-w-xs">
              Mewujudkan binder custom impianmu dengan kualitas premium dan
              desain yang estetik.
            </p>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900 tracking-wider uppercase">
              Layanan
            </h3>
            <ul className="mt-4 space-y-4">
              <li>
                <Link
                  href="/products"
                  className="text-base text-gray-500 hover:text-primary"
                >
                  Katalog
                </Link>
              </li>
              <li>
                <Link
                  href="/custom"
                  className="text-base text-gray-500 hover:text-primary"
                >
                  Custom Order
                </Link>
              </li>
              <li>
                <Link
                  href="/track"
                  className="text-base text-gray-500 hover:text-primary"
                >
                  Lacak Pesanan
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900 tracking-wider uppercase">
              Kontak
            </h3>
            <ul className="mt-4 space-y-4">
              <li className="text-base text-gray-500">
                WhatsApp: 0812-3456-7890
              </li>
              <li className="text-base text-gray-500">
                Email: halo@bananasbindery.com
              </li>
              <li className="text-base text-gray-500">
                Instagram: @bananasbindery
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-12 border-t border-gray-100 pt-8 flex justify-between items-center">
          <p className="text-base text-gray-400">
            &copy; {new Date().getFullYear()} Bananasbindery. All rights
            reserved.
          </p>
          <div className="flex space-x-6">
            <span className="text-xs text-gray-400">
              Made with 🍌 in Indonesia
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
