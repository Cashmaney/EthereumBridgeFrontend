import * as React from 'react';
import { Box } from 'grommet';
import * as styles from './styles.styl';
import {
  Form,
  Input,
  isRequired,
  MobxForm,
  NumberInput,
} from 'components/Form';
import { inject, observer } from 'mobx-react';
import { IStores } from 'stores';
import { Button, Icon, Text } from 'components/Base';
import {
  formatWithTwoDecimals,
  maxAmount,
  moreThanZero,
  ones,
  truncateAddressString,
} from 'utils';
import { EXPLORER_URL } from '../../blockchain-bridge';
import { Spinner } from 'ui/Spinner';
import { EXCHANGE_MODE, EXCHANGE_STEPS } from '../../stores/Exchange';
import { Details } from './Details';
import { AuthWarning } from '../../components/AuthWarning';
import { Steps } from './Steps';

@inject('user', 'exchange', 'actionModals', 'userMetamask')
@observer
export class Exchange extends React.Component<
  Pick<IStores, 'user'> &
    Pick<IStores, 'exchange'> &
    Pick<IStores, 'actionModals'> &
    Pick<IStores, 'userMetamask'>
> {
  formRef: MobxForm;

  onClickHandler = async (needValidate: boolean, callback: () => void) => {
    const { actionModals, user } = this.props;

    if (!user.isAuthorized) {
      if (!user.isOneWallet) {
        return actionModals.open(() => <AuthWarning />, {
          title: '',
          applyText: 'Got it',
          closeText: '',
          noValidation: true,
          width: '500px',
          showOther: true,
          onApply: () => {
            return Promise.resolve();
          },
        });
      } else {
        await user.signIn();
      }
    }

    if (needValidate) {
      this.formRef.validateFields().then(() => {
        callback();
      });
    } else {
      callback();
    }
  };

  render() {
    const { user, exchange, userMetamask } = this.props;

    let icon = () => <Icon style={{ width: 50 }} glyph="RightArrow" />;
    let description = 'Approval';

    switch (exchange.actionStatus) {
      case 'fetching':
        icon = () => <Spinner />;
        description = '';
        break;

      case 'error':
        icon = () => <Icon size="50" style={{ width: 50 }} glyph="Alert" />;
        description = exchange.error;
        break;

      case 'success':
        icon = () => <Icon size="50" style={{ width: 50 }} glyph="CheckMark" />;
        description = 'Success';
        break;
    }

    const Status = () => (
      <Box
        direction="column"
        align="center"
        justify="center"
        fill={true}
        pad="medium"
        style={{ background: '#dedede40' }}
      >
        {icon()}
        <Box className={styles.description} margin={{ top: 'medium' }}>
          <Text>{description}</Text>
          <Box margin={{ top: 'medium' }}>
            <Steps />
          </Box>
          {/*{exchange.txHash ? (*/}
          {/*  <a*/}
          {/*    style={{ marginTop: 10 }}*/}
          {/*    href={EXPLORER_URL + `/tx/${exchange.txHash}`}*/}
          {/*    target="_blank"*/}
          {/*  >*/}
          {/*    Tx id: {truncateAddressString(exchange.txHash)}*/}
          {/*  </a>*/}
          {/*) : null}*/}
        </Box>
      </Box>
    );

    return (
      <Box direction="column" pad="xlarge" className={styles.exchangeContainer}>
        <Form
          ref={ref => (this.formRef = ref)}
          data={this.props.exchange.transaction}
          {...({} as any)}
        >
          {exchange.step.id === EXCHANGE_STEPS.BASE &&
          exchange.mode === EXCHANGE_MODE.ETH_TO_ONE ? (
            <Box direction="column" fill={true}>
              <Box
                direction="column"
                gap="2px"
                fill={true}
                margin={{ bottom: 'large' }}
              >
                <NumberInput
                  label="BUSD Amount"
                  name="amount"
                  type="decimal"
                  placeholder="0"
                  style={{ width: '100%' }}
                  rules={[
                    isRequired,
                    moreThanZero,
                    (_, value, callback) => {
                      const errors = [];

                      if (
                        value &&
                        Number(value) > Number(userMetamask.ethBUSDBalance)
                      ) {
                        const defaultMsg = `Exceeded the maximum amount`;
                        errors.push(defaultMsg);
                      }

                      callback(errors);
                    },
                  ]}
                />
                <Text size="small" style={{ textAlign: 'right' }}>
                  <b>*Max Available</b> ={' '}
                  {formatWithTwoDecimals(userMetamask.ethBUSDBalance)} BUSD
                </Text>
              </Box>

              <Box direction="column" fill={true}>
                <Input
                  label="ONE Address"
                  name="oneAddress"
                  style={{ width: '100%' }}
                  placeholder="Your address"
                  rules={[isRequired]}
                />
              </Box>
            </Box>
          ) : null}

          {exchange.step.id === EXCHANGE_STEPS.BASE &&
          exchange.mode === EXCHANGE_MODE.ONE_TO_ETH ? (
            <Box direction="column" fill={true}>
              <Box
                direction="column"
                gap="2px"
                fill={true}
                margin={{ bottom: 'large' }}
              >
                <NumberInput
                  label="BUSD Amount"
                  name="amount"
                  type="decimal"
                  placeholder="0"
                  style={{ width: '100%' }}
                  rules={[
                    isRequired,
                    moreThanZero,
                    (_, value, callback) => {
                      const errors = [];

                      if (
                        value &&
                        Number(value) > Number(user.hmyBUSDBalance)
                      ) {
                        const defaultMsg = `Exceeded the maximum amount`;
                        errors.push(defaultMsg);
                      }

                      callback(errors);
                    },
                  ]}
                />
                <Text size="small" style={{ textAlign: 'right' }}>
                  <b>*Max Available</b> ={' '}
                  {formatWithTwoDecimals(user.hmyBUSDBalance)} BUSD
                </Text>
              </Box>

              <Box direction="column" fill={true}>
                <Input
                  label="ETH Address"
                  name="ethAddress"
                  style={{ width: '100%' }}
                  placeholder="Your address"
                  rules={[isRequired]}
                />
              </Box>
            </Box>
          ) : null}
        </Form>

        {exchange.step.id === EXCHANGE_STEPS.CONFIRMATION ? (
          <Details showTotal={true} />
        ) : null}

        {exchange.step.id === EXCHANGE_STEPS.SENDING ? (
          <Details>
            <Status />
          </Details>
        ) : null}

        {exchange.step.id === EXCHANGE_STEPS.RESULT ? (
          <Details>
            <Status />
          </Details>
        ) : null}

        <Box
          direction="row"
          margin={{ top: 'large' }}
          justify="end"
          align="center"
        >
          {exchange.step.buttons.map((conf, idx) => (
            <Button
              key={idx}
              bgColor="#00ADE8"
              style={{ width: conf.transparent ? 140 : 180 }}
              onClick={() => {
                this.onClickHandler(conf.validate, conf.onClick);
              }}
              transparent={!!conf.transparent}
            >
              {conf.title}
            </Button>
          ))}
        </Box>
      </Box>
    );
  }
}
