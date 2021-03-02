import * as React from 'react';
import { Box } from 'grommet';
import { observer } from 'mobx-react-lite';
import { Button, Icon, Text, Title } from 'components/Base';
import { Error } from 'ui';
import cn from 'classnames';
import * as styles from './wallet-balances.styl';
import { formatWithSixDecimals, sleep, truncateAddressString, unlockToken } from 'utils';
import { useStores } from '../../stores';
import { AuthWarning } from '../../components/AuthWarning';
import { EXCHANGE_MODE, ITokenInfo, TOKEN } from '../../stores/interfaces';
import Loader from 'react-loader-spinner';
import 'react-loader-spinner/dist/loader/css/react-spinner-loader.css';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import UnlockToken from 'components/Earn/EarnRow/UnlockToken';
import { useEffect, useState } from 'react';

const getTokenName = (tokenType: TOKEN, token: ITokenInfo) => {
  switch (tokenType) {
    case TOKEN.ERC20:
      if (!token.display_props.proxy) {
        return token.display_props.symbol;
      } else {
        return token.name;
      }
    case TOKEN.S20:
      if (!token.display_props.proxy) {
        return `secret${token.display_props.symbol}`;
      } else {
        return token.name;
      }
    case TOKEN.ETH:
    default:
      return `ETH`;
  }
};

const WalletTemplate = observer((props: {
  address: string,
  symbol: string,
  amount: string,
}) => <Box direction="row" background="white" style={{ borderRadius: 4 }}>
    <Box pad="xxsmall" align="center" direction="row">
      <img className={styles.imgToken} src={"/static/wallet.svg"} />
      <Text margin={{ left: 'xxsmall' }}>{truncateAddressString(props.address, 10)}</Text>
    </Box>
    <Box pad="xxsmall" background="#DBDCE1" align="center" direction="row" style={{ borderRadius: 4 }}>
      {props.amount ? <Text bold>{props.amount}</Text> :
        <Loader type="ThreeDots" color="#00BFFF" height="1em" width="1em" />}
      <Text bold margin={{ left: 'xxsmall' }}>{props.symbol}</Text>
    </Box>
  </Box>
)

const AssetRow = observer<any>(props => {
  let value = (
    <Box direction="row">
      <Text color={props.selected ? '#00ADE8' : null} bold={true}>
        {props.address ? truncateAddressString(props.value, 10) : formatWithSixDecimals(props.value)}
      </Text>
      {props.address && (
        <CopyToClipboard text={props.value}>
          <Icon glyph="PrintFormCopy" size="1em" color="#1c2a5e" style={{ marginLeft: 10, width: 20 }} />
        </CopyToClipboard>
      )}
    </Box>
  );

  if (!props.value) {
    value = <Loader type="ThreeDots" color="#00BFFF" height="1em" width="1em" />;
  } else if (props.value === unlockToken) {
    value = (
      <div style={{ margin: 0, display: 'flex', flexDirection: 'row' }}>
        <UnlockToken
          userStore={props.userStore}
          tokenAddress={props.token.dst_address}
          selected={props.selected}
          subtitle={null}
          showSubTitle={false}
          pulseInterval={props.pulseInterval}
          title="View Balance"
        />
      </div>
    );
  } else if (props.value === 'Fix Unlock') {
    value = (
      <Box direction="column">
        <Text color="red">Fix Viewing Key</Text>
        <Text color="red" style={{ fontSize: '0.75em' }}>
          Keplr -{'>'}
        </Text>
        <Text color="red" style={{ fontSize: '0.75em' }}>
          Secret Network -{'>'}
        </Text>
        <Text color="red" style={{ fontSize: '0.75em' }}>
          Token List
        </Text>
      </Box>
    );
  }

  return (
    <Box className={cn(styles.walletBalancesRow, props.last ? '' : styles.underline)}>
      <Box direction="row" align="center" justify="center">
        <Text
          color={props.selected ? '#00ADE8' : null}
          bold={false}
          style={props.value === unlockToken ? { padding: '1em 0 1em 0' } : null}
        >
          {props.asset}
        </Text>
        {props.link ? (
          <a href={props.link} target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}>
            <Icon glyph="ExternalLink" style={{ width: 14, margin: '0 0 2px 10px' }} />
          </a>
        ) : null}
      </Box>

      <Box direction="column" align="end">
        <Box className={styles.priceColumn}>{value}</Box>
      </Box>
    </Box>
  );
});

export const WalletBalances = observer(() => {
  const { user, userMetamask, actionModals, exchange, tokens } = useStores();

  const [displayedTokens, setDisplayedTokens] = useState<Array<ITokenInfo>>([]);
  const [displayedBalances, setdisplayedBalances] = useState({});

  useEffect(() => {
    const refreshSelectedToken = async () => {
      while (tokens.isPending || !user.secretjs) {
        await sleep(100);
      }

      if (user.snip20Address === process.env.SSCRT_CONTRACT) {
        user.snip20Balance = user.balanceToken['sSCRT'];
        user.snip20BalanceMin = user.balanceTokenMin['sSCRT'];
      }

      exchange.token === TOKEN.ERC20
        ? setDisplayedTokens(
          tokens.allData.filter(
            token =>
              token.display_props &&
              exchange.token === TOKEN.ERC20 &&
              user.snip20Address === token.dst_address &&
              token.name !== 'WSCRT',
          ),
        )
        : setDisplayedTokens(tokens.allData.filter(token => token.src_coin === 'Ethereum'));
    };

    refreshSelectedToken();
  }, [user.secretjs, tokens, user.snip20Address, exchange.token]);

  useEffect(() => {
    const updateBalanceForAddress = async () => {
      const balances = [];
      for (const token of displayedTokens) {
        //await user.updateBalanceForSymbol(token.display_props.symbol);
        balances[token.display_props.symbol] = user.balanceToken[token.src_coin];
      }

      setdisplayedBalances(balances);
    };

    updateBalanceForAddress();
  }, [user, displayedTokens]);

  return (
    <Box direction="row" pad="none" align="end" style={{ minHeight: 50 }}>
      <Box margin={{ right: 'small' }}>
        {!user.isAuthorized ? <Button
          onClick={() => {
            if (!user.isKeplrWallet) {
              actionModals.open(() => <AuthWarning />, {
                title: '',
                applyText: 'Got it',
                closeText: '',
                noValidation: true,
                width: '500px',
                showOther: true,
                onApply: () => Promise.resolve(),
              });
            } else {
              user.signIn();
            }
          }}
        >
          Connect with Keplr
          </Button> : <WalletTemplate
            address={user.address}
            amount={user.balanceSCRT || ""}
            symbol="SCRT"
          />
        }
        {/* {!user.isKeplrWallet ? <Error error="Keplr not found" /> : null} */}
        {/* {user.error ? <Error error={user.error} /> : null} */}
      </Box>

      <Box>
        {!userMetamask.isAuthorized ? <Button onClick={() => userMetamask.signIn(true)}>
          Connect with Metamask
          </Button> : <WalletTemplate
            address={userMetamask.ethAddress}
            amount={userMetamask.ethBalance}
            symbol="ETH"
          />
        }
        {/* {userMetamask.error ? <Error error={userMetamask.error} /> : null} */}
      </Box>
    </Box>
  )

  return (
    <Box direction="column" className={styles.walletBalances} margin={{ vertical: 'large' }}>
      {/*<Title>Wallet Info</Title>*/}

      <Box className={styles.container}>
        <Box direction="column" margin={{ bottom: 'large' }}>
          <Box direction="row" align="center" justify="between" margin={{ bottom: 'xsmall' }}>
            <Box direction="row" align="center">
              <img className={styles.imgToken} src="/static/eth.svg" />
              <Title margin={{ right: 'xsmall' }}>Ethereum</Title>
              <Text margin={{ top: '4px' }}>(Metamask)</Text>
            </Box>
            {userMetamask.isAuthorized && (
              <Box
                onClick={() => {
                  userMetamask.signOut();
                }}
                margin={{ left: 'medium' }}
              >
                <Icon glyph="Logout" size="24px" style={{ opacity: 0.5 }} color="BlackTxt" />
              </Box>
            )}
          </Box>

          {userMetamask.isAuthorized ? (
            <>
              <AssetRow asset="ETH Address" value={userMetamask.ethAddress} address={true} />

              <AssetRow
                asset="ETH"
                value={userMetamask.ethBalance}
                selected={exchange.token === TOKEN.ETH && exchange.mode === EXCHANGE_MODE.ETH_TO_SCRT}
              />

              {tokens.allData
                .filter(
                  token =>
                    token.display_props &&
                    exchange.token === TOKEN.ERC20 &&
                    userMetamask.erc20Address === token.src_address,
                )
                .map((token, idx) => (
                  <AssetRow
                    key={idx}
                    asset={getTokenName(TOKEN.ERC20, token)}
                    value={userMetamask.balanceToken[token.src_coin]}
                    link={`${process.env.ETH_EXPLORER_URL}/token/${token.src_address}`}
                    selected={true}
                  />
                ))}
            </>
          ) : (
              <Box direction="row" align="baseline" justify="start">
                <Button
                  margin={{ vertical: 'medium' }}
                  onClick={() => {
                    userMetamask.signIn(true);
                  }}
                >
                  Connect with Metamask
              </Button>
                {userMetamask.error ? <Error error={userMetamask.error} /> : null}
              </Box>
            )}
        </Box>

        <Box direction="column">
          <Box direction="row" justify="between" margin={{ bottom: 'xsmall' }}>
            <Box direction="row" align="center">
              <img className={styles.imgToken} src="/static/scrt.svg" />
              <Title margin={{ right: 'xsmall' }}>Secret Network</Title>
              <Text margin={{ top: '4px' }}>(Keplr)</Text>
            </Box>
            {user.isAuthorized && (
              <Box
                onClick={() => {
                  user.signOut();
                }}
                margin={{ left: 'medium' }}
              >
                <Icon glyph="Logout" size="24px" style={{ opacity: 0.5 }} color="BlackTxt" />
              </Box>
            )}
          </Box>

          {user.isAuthorized ? (
            <>
              <AssetRow asset="Secret Address" value={user.address} address={true} />
              <AssetRow asset="SCRT" value={user.balanceSCRT} />
              <AssetRow
                asset="secretSCRT"
                value={user.balanceToken['sSCRT']}
                token={{ dst_address: process.env.SSCRT_CONTRACT }}
                userStore={user}
                link={`${process.env.SCRT_EXPLORER_URL}/contracts/${process.env.SSCRT_CONTRACT}`}
                selected={user.snip20Address === process.env.SSCRT_CONTRACT}
              />
              {/*{exchange.token === TOKEN.ETH ? (*/}
              {/*  <AssetRow*/}
              {/*    asset="secretETH"*/}
              {/*    value={displayedBalances['ETH']}*/}
              {/*    token={tokens.allData.find(token => token.src_coin === 'Ethereum')}*/}
              {/*    userStore={user}*/}
              {/*    link={(() => {*/}
              {/*      const eth = tokens.allData.find(token => token.src_coin === 'Ethereum');*/}
              {/*      if (!eth) {*/}
              {/*        return undefined;*/}
              {/*      }*/}
              {/*      return `${process.env.SCRT_EXPLORER_URL}/contracts/${eth.dst_address}`;*/}
              {/*    })()}*/}
              {/*    selected={true}*/}
              {/*  />*/}
              {/*) : null}*/}
              {displayedTokens.map((token, idx) => {
                return (
                  <AssetRow
                    key={idx}
                    asset={getTokenName(TOKEN.S20, token)}
                    value={displayedBalances[token.display_props.symbol]}
                    token={token}
                    userStore={user}
                    link={`${process.env.SCRT_EXPLORER_URL}/contracts/${token.dst_address}`}
                    selected={
                      exchange.token === TOKEN.ERC20 &&
                      exchange.mode === EXCHANGE_MODE.SCRT_TO_ETH &&
                      user.snip20Address === token.dst_address
                    }
                  />
                );
              })}
            </>
          ) : (
              <Box direction="row" align="baseline" justify="start">
                <Button
                  margin={{ vertical: 'medium' }}
                  onClick={() => {
                    if (!user.isKeplrWallet) {
                      actionModals.open(() => <AuthWarning />, {
                        title: '',
                        applyText: 'Got it',
                        closeText: '',
                        noValidation: true,
                        width: '500px',
                        showOther: true,
                        onApply: () => Promise.resolve(),
                      });
                    } else {
                      user.signIn();
                    }
                  }}
                >
                  Connect with Keplr
              </Button>
                {!user.isKeplrWallet ? <Error error="Keplr not found" /> : null}
                {user.error ? <Error error={user.error} /> : null}
              </Box>
            )}
        </Box>
      </Box>
    </Box>
  );
});
