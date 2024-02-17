import dynamic from "next/dynamic";

// Use dynamic import for client-side only module
const MainComponent = dynamic(() => import("./mainClient"), { ssr: false });

export default function Home() {
	return <MainComponent />;
}
