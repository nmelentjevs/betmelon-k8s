import React, { memo, useState, useEffect } from 'react';

import axios from 'axios';
import moment from 'moment';

import PropTypes from 'prop-types';

// Animation Sprting
import { useSpring, a } from 'react-spring';
import { useMeasure, usePrevious } from './bets-display-helpers/helpers';
import {
  Global,
  Frame,
  Title,
  Content,
  toggle
} from './bets-display-helpers/styles';
import * as Icons from './bets-display-helpers/icons';

// Components
import Bet from './bet/Bet';

const Tree = memo(({ children, name, style, defaultOpen = false }) => {
  const [isOpen, setOpen] = useState(defaultOpen);
  const previous = usePrevious(isOpen);
  const [bind, { height: viewHeight }] = useMeasure();
  const { height, opacity, transform } = useSpring({
    from: { height: 0, opacity: 0, transform: 'translate3d(20px,0,0)' },
    to: {
      height: isOpen ? viewHeight : 0,
      opacity: isOpen ? 1 : 0,
      transform: `translate3d(${isOpen ? 0 : 20}px,0,0)`
    }
  });
  const Icon =
    Icons[`${children ? (isOpen ? 'Minus' : 'Plus') : 'Close'}SquareO`];
  return (
    <Frame>
      <Icon
        style={{ ...toggle, opacity: children ? 1 : 0.3 }}
        onClick={() => setOpen(!isOpen)}
      />
      <Title style={style}>{name}</Title>
      <Content
        style={{
          opacity,
          height: isOpen && previous === isOpen ? 'auto' : height
        }}
      >
        <a.div style={{ transform }} {...bind} children={children} />
      </Content>
    </Frame>
  );
});

const BetTree = ({ username, mock, betFromBets }) => {
  const [bets, setBets] = useState([]);

  useEffect(() => {
    // refreshBets();
    setBets(betFromBets);
  }, [betFromBets]);

  const refreshBets = () => {
    // const { username } = match.params;
    axios
      .get(`/api/bets/loadbets/${username}`)
      .then(res => {
        console.log(res.data);
        // setLoading(false);
        if (res.data.msg !== 'No entries found') {
          if (res.data.bets.length !== 0) {
            setBets(res.data.bets);
          }
        }
      })
      .catch(err => console.log(err));
  };

  const displayBetsTree = data => {
    let countryObj = {};
    const countries = data.map(bet => {
      countryObj = { ...countryObj, [bet.country]: 0 };
      return bet.country.replace(' ', '');
    });

    const unique = (value, index, self) => {
      return self.indexOf(value) === index;
    };

    const count = (array, value) => {
      return array.filter(v => v === value).length;
    };

    const betOnCountryAmount = countries
      .filter(unique)
      .map(b => {
        return { x: b, y: count(countries, b) };
      })
      .sort((a, b) => a.y - b.y);

    let sortedCountries = [];
    betOnCountryAmount.map(b => {
      return sortedCountries.push(b.x);
    });

    let tree = [];
    data.map(bet => {
      tree = [
        ...tree,
        { [bet.country.replace(' ', '')]: { [bet.league]: { bets: [] } } }
      ];
      return '';
    });

    tree.map(tre => {
      data.map(bet => {
        if (bet.country.toString() === Object.keys(tre).toString()) {
          if (Object.keys(tre[bet.country])[0].toString() === bet.league) {
            return tre[bet.country][bet.league].bets.push(bet);
          }
        }
      });
      return '';
    });

    const result = tree.reduce((unique, o) => {
      if (
        !unique.some(
          obj =>
            Object.keys(obj[Object.keys(obj).toString()])[0] ===
            Object.keys(o[Object.keys(o).toString()])[0]
        )
      ) {
        unique.push(o);
      }
      return unique;
    }, []);

    const displayTreeArray = [];
    const test = sortedCountries.map(b => {
      let countryBet = result.filter(a => {
        return b === Object.keys(a).toString();
      });

      displayTreeArray.push(countryBet);
    });

    const display = displayTreeArray
      .sort((a, b) => {
        if (
          Object.keys(a[Object.keys(a)[0]]) < Object.keys(b[Object.keys(b)[0]])
        ) {
          return -1;
        }
        if (
          Object.keys(a[Object.keys(a)[0]]) > Object.keys(b[Object.keys(b)[0]])
        ) {
          return 1;
        }
        return 0;
      })
      .map((tree, i) => {
        return tree.map((t, i) => {
          return (
            <Tree
              name={Object.keys(t)}
              key={i + Object.keys(t)}
              defaultOpen={mock && Object.keys(t) == 'England'}
            >
              {tree.map((t, i) => {
                return (
                  <Tree
                    defaultOpen={
                      mock &&
                      `${Object.keys(t[Object.keys(t)])} - W${
                        t[Object.keys(t)][
                          Object.keys(t[Object.keys(t)])
                        ].bets.filter(b => b.result.match('^W')).length
                      } - L${
                        t[Object.keys(t)][
                          Object.keys(t[Object.keys(t)])
                        ].bets.filter(b => b.result.match('^L')).length
                      }` == 'Premier League - W3 - L0'
                    }
                    name={`${Object.keys(t[Object.keys(t)])} - W${
                      t[Object.keys(t)][
                        Object.keys(t[Object.keys(t)])
                      ].bets.filter(b => b.result.match('^W')).length
                    } - L${
                      t[Object.keys(t)][
                        Object.keys(t[Object.keys(t)])
                      ].bets.filter(b => b.result.match('^L')).length
                    }`}
                    key={i}
                  >
                    {t[Object.keys(t)][Object.keys(t[Object.keys(t)])].bets
                      .sort((a, b) =>
                        moment.utc(b.date_added).diff(moment.utc(a.date_added))
                      )
                      .map((bet, i) => {
                        return (
                          <Tree
                            name={`${bet.teams} - ${bet.result} - ${moment(
                              bet.date_added
                            ).format('DD MMM YY')}`}
                            key={bet.date_added}
                          >
                            <Bet
                              bet={bet}
                              username={username}
                              bg="dark"
                              text="white"
                              refreshBets={refreshBets}
                            />
                          </Tree>
                        );
                      })}
                  </Tree>
                );
              })}
            </Tree>
          );
        });
      });

    const displayFiltered = display.map(x => x[0]);

    return displayFiltered;
  };

  return (
    <>
      {bets.length > 0 ? (
        <>
          <Global />
          {/* <button onClick={() => displayBetsTree(bets)}>ok</button> */}
          <Tree name="Bets" defaultOpen>
            {displayBetsTree(bets)}
          </Tree>{' '}
        </>
      ) : (
        ''
      )}
    </>
  );
};

BetTree.propTypes = {
  username: PropTypes.string,
  betsFromBets: PropTypes.array,
  mock: PropTypes.bool
};

export default BetTree;
