import React from 'react';
import { SigningCosmWasmClient } from 'secretjs';
import { Message } from 'semantic-ui-react';

export const BetaWarning = ({ secretjs }: { secretjs: SigningCosmWasmClient }) => {
  if (process.env.ENV === 'MAINNET') {
    return (
      <Message warning>
        <Message.Header>Hello early birds! 👋</Message.Header>
        <p>
          <strong>Converting SCRT to sSCRT:</strong> Use{' '}
          <a href="https://wallet.keplr.app/#/secret-2/secret-secret" target="_blank">
            this tool
          </a>{' '}
          by Keplr
        </p>
        <p>Enjoy your front-running resistant swaps!</p>
      </Message>
    );
  }

  return (
    <Message warning>
      <Message.Header>Feedback channels:</Message.Header>
      <ul>
        <li>
          Open a{' '}
          <a href="https://github.com/enigmampc/EthereumBridgeFrontend/issues/new" target="_blank">
            GitHub issue
          </a>
        </li>
        <li>
          <a href="https://discord.com/channels/360051864110235648/805840792303960155" target="_blank" rel="noreferrer">
            #🔀secret-swap
          </a>{' '}
          on{' '}
          <a href="https://chat.scrt.network" target="_blank" rel="noreferrer">
            Discord
          </a>
        </li>
        <li>
          Tag @assafmo on{' '}
          <a href="https://t.me/SCRTCommunity" target="_blank" rel="noreferrer">
            Telegram
          </a>
        </li>
      </ul>
    </Message>
  );
};
