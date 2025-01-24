pragma solidity ^0.8.0;

import { MtrToken } from "../src/MtrToken.sol";
import { Script, console } from "../lib/forge-std/src/Script.sol";

contract DeployToken is Script {
    function run() external {
        // Folosim direct cheia privată
        vm.startBroadcast(0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80);

        MtrToken token = new MtrToken(1000000 * 10 ** 18);
        console.log("MtrToken deployed at:", address(token));

        vm.stopBroadcast();
    }
}
