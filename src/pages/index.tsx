import { useState, useCallback } from "react";
import Image from "next/image";
import { Inter } from "next/font/google";
import { Header } from "@/components/header";
import { ethers } from "ethers";

const inter = Inter({ subsets: ["latin"] });

export interface AccountType {
  address?: string;
  balance?: string;
  chainId?: string;
  network?: string;
}

export default function Home() {
  const [accountData, setAccountData] = useState<AccountType>({});
  const [owner, setOwner] = useState<string>("");
  const [URI, setURI] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [imgURI, setImgURI] = useState<string>("");

  const nftAddress = "0x3CAC571aca6AEc944874f5597c17F6ee52162F48";
  const baseHash = "QmYHhfio7XL6v58SN8Ry794f4eQZ4DjjkmVX2ARsNXrgkt";

  const _connectToMetaMask = useCallback(async () => {
    const ethereum = (window as any).ethereum;
    // Check if MetaMask is installed
    if (typeof ethereum !== "undefined") {
      try {
        // Request access to the user's MetaMask accounts
        const accounts = await ethereum.request({
          method: "eth_requestAccounts",
        });
        // Get the connected Ethereum address
        const address = accounts[0];
        // Create an ethers.js provider using the injected provider from MetaMask
        const provider = new ethers.BrowserProvider(ethereum);
        // Get the account balance
        const balance = await provider.getBalance(address);
        // Get the network ID from MetaMask
        const network = await provider.getNetwork();
        // Update state with the results
        setAccountData({
          address,
          balance: ethers.formatEther(balance),
          // The chainId property is a bigint, change to a string
          chainId: network.chainId.toString(),
          network: network.name,
        });
      } catch (error: Error | any) {
        alert(`Error connecting to MetaMask: ${error?.message ?? error}`);
      }
    } else {
      alert("MetaMask not installed");
    }
  }, []);

  const _safeMint = useCallback(async () => {
    const ethereum = await (window as any).ethereum;
    // Create an ethers.js provider using the injected provider from MetaMask
    // And get the signer (account) from the provider
    const signer = await new ethers.BrowserProvider(ethereum).getSigner();
    const abi = [
      "function safeMint(address to, string memory uri) public"
    ];
    const NFTContract = new ethers.Contract(nftAddress, abi, signer);

    try {
      setLoading(true);
      const tx = await NFTContract.safeMint(owner, URI);
      await tx.wait();
      alert(`NFT minted: ${tx.hash}`);
    } catch (error) {
      alert(`Error minting NFT: ${String(error)}`);
    } finally {
      setLoading(false);
    }
  }, [owner, URI]);

  const _onChangeOwner = (e: React.ChangeEvent<HTMLInputElement>) => {
    setOwner(e.target.value);
  };

  const _onChangeURI = (e: React.ChangeEvent<HTMLInputElement>) => {
    setURI(e.target.value);
    setImgURI("");
    setLoading(true);
    fetch(`https://ipfs.io/ipfs/${baseHash}/${e.target.value}`)
    .then(res => res.json())
    .then(data => {
      if (data.error) {
        console.error(data.error);
        return;
      }

      if (!data.image) {
        console.error("No image found in the metadata");
        return;
      }

      setImgURI(data.image.split('//')[1]);
    })
    .catch((err) => {
      console.error(err);
    })
    .finally(() => {
      setLoading(false);
    });
  };

  return (
    <div
      className={`h-full flex flex-col before:from-white after:from-sky-200 py-2 ${inter.className}`}
    >
      <Header {...accountData} />
      <div className="flex flex-col flex-1 justify-center items-center">
        <div className="grid gap-4">
          {accountData?.address ? (
            <>
              <span className="text-lg">
                NFT address: {nftAddress}
              </span>
              <input
                type="text"
                onChange={_onChangeOwner}
                className="border-black border-2 rounded-lg p-2"
                placeholder="Owner Address"
              />
              <input
                type="text"
                onChange={_onChangeURI}
                className="border-black border-2 rounded-lg p-2"
                placeholder="TokenID"
              />
              <button
                onClick={_safeMint}
                disabled={!owner || !URI || loading}
                className="bg-black text-white p-4 rounded-lg"
              >
                {(loading) ? `Waiting...`:'Mint NFT'}
              </button>

              <Image
                src={imgURI ? `https://ipfs.io/ipfs/${imgURI}`: ""}
                alt="NFT"
                width={320}
                height={160}
                hidden={!imgURI}
              />
            </>
          ) : (
            <>
              <Image
                src="https://images.ctfassets.net/9sy2a0egs6zh/4zJfzJbG3kTDSk5Wo4RJI1/1b363263141cf629b28155e2625b56c9/mm-logo.svg"
                alt="MetaMask"
                width={320}
                height={140}
                priority
              />
              <button
                onClick={_connectToMetaMask}
                className="bg-black text-white p-4 rounded-lg"
              >
                Connect to MetaMask
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
