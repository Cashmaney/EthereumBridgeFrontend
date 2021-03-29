import * as React from 'react';
import { useEffect, useState } from 'react';
import { Box } from 'grommet';
import { BaseContainer, PageContainer } from 'components';
import { observer } from 'mobx-react-lite';
import { useStores } from 'stores';
import * as styles from '../EthBridge/styles.styl';
// import { IColumn, Table } from '../../components/Table';
// import { ERC20Select } from '../Exchange/ERC20Select';
import EarnRow from '../../components/Earn/EarnRow';
import { rewardsDepositKey, rewardsKey } from '../../stores/UserStore';
import { divDecimals, sleep } from '../../utils';
import { InfoModalEarn } from '../../components/InfoModalEarn';
import { Icon } from 'components/Base/components/Icons';
import cogoToast from 'cogo-toast';
import EarnSelectorHeader from '../../components/Earn/EarnSelectorHeader';
import EarnInfoBox from '../../components/Earn/EarnInfoBox';

const notify = (type: 'success' | 'error', msg: string, hideAfterSec: number = 120) => {
  if (type === 'error') {
    msg = msg.replaceAll('Failed to decrypt the following error message: ', '');
    msg = msg.replace(/\. Decryption error of the error message:.+?/, '');
  }

  const { hide } = cogoToast[type](msg, {
    position: 'top-right',
    hideAfter: hideAfterSec,
    onClick: () => {
      hide();
    },
  });
  // NotificationManager[type](undefined, msg, closesAfterMs);
};

export const EarnRewards = observer((props: any) => {
  const { user, tokens, rewards } = useStores();

  const [showLpStaking, setShowLpStaking] = useState<boolean>(false);

  useEffect(() => {
    const refreshAllTokens = async () => {
      while (!user.secretjs || tokens.isPending) {
        await sleep(100);
      }
      await Promise.all([...tokens.allData.map(token => user.updateBalanceForSymbol(token.display_props.symbol))]);
    };

    refreshAllTokens();
  }, [user, tokens]);

  useEffect(() => {
    rewards.init({
      isLocal: true,
      sorter: 'none',
      pollingInterval: 20000,
    });
    rewards.fetch();
  }, []);

  const filteredTokens = tokens.allData.filter(s => !!s.display_props?.is_secret_only === showLpStaking);

  return (
    <BaseContainer>
      <PageContainer>
        <div
          style={{
            display: 'flex',
            width: '100%',
            height: '100px',
            padding: '16px',
            position: 'absolute',
            left: '0',
            top: '100px',
            backgroundColor: '#F5F8FE',
            zIndex: -1,
          }}
        />
        <div
          style={{
            display: 'flex',
            minWidth: '550px',
            maxWidth: '1100px',
            backgroundColor: '#F5F8FE',
          }}
        >
          <Icon
            glyph="InfoIcon"
            size="medium"
            color={'black'}
            style={{
              display: 'inline-block',
              marginRight: '16px',
            }}
          />
          <p
            style={{
              minWidth: '550px',
              maxWidth: '1047px',
              display: 'inline-block',
            }}
          >
            If you have created viewing keys for secretTokens and secretSCRT, you should be able to see secretTokens
            locked in the rewards contract and your rewards. If you can't see these figures please refresh your browser.
          </p>
        </div>
        <div
          style={{
            display: 'flex',
            minWidth: '550px',
            maxWidth: '1100px',
            backgroundColor: '#F5F8FE',
            marginTop: '0.3em',
          }}
        >
          <Icon
            glyph="InfoIcon"
            size="medium"
            color={'black'}
            style={{
              display: 'inline-block',
              marginRight: '16px',
            }}
          />
          <p
            style={{
              minWidth: '550px',
              maxWidth: '1047px',
              display: 'inline-block',
            }}
          >
            SushiSwap incentives for LPs on the WSCRT/WETH pair are now live!{' '}
            <a href="https://twitter.com/SecretNetwork/status/1369349930247192582" target="_blank">
              Earn more on SushiSwap Onsen
            </a>
            . 🍣
          </p>
        </div>
        <Box direction="row" wrap={true} fill={true} justify="center" align="start">
          <Box direction="column" align="center" justify="center">
            <EarnSelectorHeader setValue={setShowLpStaking} />
            <EarnInfoBox type={showLpStaking ? 'LPSTAKING' : 'BRIDGE_MINING'}/>
          </Box>
          <Box direction="column" align="center" justify="center" className={styles.base}>
            {rewards.allData
              .slice()
              .sort((a, b) => {
                /* ETH first */
                if (a.inc_token.symbol === 'sETH') {
                  return -1;
                }

                return 0;
              })
              .map(rewardToken => {
                if (Number(rewardToken.deadline) < 2_000_000) {
                  return null;
                }

                let token = filteredTokens.find(element => element.dst_address === rewardToken.inc_token.address);
                if (!token) {
                  return null;
                }

                const rewardsToken = {
                  rewardsContract: rewardToken.pool_address,
                  lockedAsset: rewardToken.inc_token.symbol,
                  lockedAssetAddress: token.dst_address,
                  totalLockedRewards: divDecimals(
                    Number(rewardToken.total_locked) * Number(token.price),
                    rewardToken.inc_token.decimals,
                  ),
                  rewardsDecimals: String(rewardToken.rewards_token.decimals),
                  rewards: user.balanceRewards[rewardsKey(rewardToken.inc_token.symbol)],
                  deposit: user.balanceRewards[rewardsDepositKey(rewardToken.inc_token.symbol)],
                  balance: user.balanceToken[token.src_coin],
                  decimals: token.decimals,
                  name: token.name,
                  price: token.price,
                  rewardsPrice: String(rewardToken.rewards_token.price),
                  display_props: token.display_props,
                  remainingLockedRewards: rewardToken.pending_rewards,
                  deadline: Number(rewardToken.deadline),
                };

                return (
                  <EarnRow notify={notify} key={rewardToken.inc_token.symbol} userStore={user} token={rewardsToken} />
                );
              })}
          </Box>
        </Box>
        <InfoModalEarn />
      </PageContainer>
    </BaseContainer>
  );
});
