import React, { Component, PropTypes } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { debounce } from 'underscore';
import cx from 'classnames';

import { gettext } from 'lib/utils';
import * as graphite from 'lib/utils/graphite';
import * as appActions from 'lib/actions/app-actions'
import Error from 'lib/components/error';
import Graph from 'lib/components/graph';
import TimeSliceNav from 'lib/components/time-slice-nav';
import Spinner from 'lib/components/spinner';


export class App extends Component {

  static propTypes = {
    app: PropTypes.object.isRequired,
    dispatch: PropTypes.func.isRequired,
    window: PropTypes.object,
  }

  static defaultProps = {
    window: window,
  }

  constructor(props) {
    super(props);
    this.boundAppActions = bindActionCreators(appActions, props.dispatch);
    this.boundAppActions.checkForGraphite()
    this.setPanelSize();
    window.onresize = debounce(this.setPanelSize, 300);
  }

  setPanelSize = () => {
    var win = this.props.window;
    var width;

    if (win.clientWidth) {
      console.log('setting panel size from clientWidth');
      width = win.clientWidth;
    } else {
      var hasVScroll;
      var cStyle = (document.body.currentStyle ||
                    window.getComputedStyle(document.body, ""));

      if (cStyle) {
        // Check the overflow and overflowY properties
        // for "auto" and "visible" values
        hasVScroll = cStyle.overflow == "visible"
                     || cStyle.overflowY == "visible"
                     || (hasVScroll && cStyle.overflow == "auto")
                     || (hasVScroll && cStyle.overflowY == "auto");
      }
      console.log('guessing inner width from CSS padding; innerWidth:',
                  win.innerWidth);
      var horizontalMargin = 40;  // matches padding * 2 from _base.scss
      width = (win.innerWidth - horizontalMargin)
      if (hasVScroll) {
        console.log('adjusting width for scollbars');
        width = width - 15;
      }
    }

    this.boundAppActions.setPanelSize({
      width: width,
      height: win.clientHeight || win.innerHeight,
    });
  }

  render() {
    if (this.props.app.error) {
      return <Error message={this.props.app.error} />;
    } else if (!this.props.app.panelSize.width) {
      return <Spinner text={gettext('Loading some hot graphs')} />;
    } else {
      var graphHeight = this.props.app.graphHeight;
      // Make a guess at how many columns they may want to see.
      // TODO: make this configurable.
      var columns = Math.round(this.props.app.panelSize.width / 700, 1);
      var graphWidth = Math.floor(this.props.app.panelSize.width / columns);
      console.log('grid columns:', columns,
                  'panel width:', this.props.app.panelSize.width,
                  'graph width:', graphWidth);

      var graphConf = {
        width: graphWidth,
        height: graphHeight,
        timeSlice: this.props.app.timeSlice,
      };

      return (
        <div>
          <TimeSliceNav
            current={this.props.app.timeSlice}
            setTimeSlice={this.boundAppActions.setTimeSlice}
          />
          <div>
            <Graph title="Response Count"
              getUrl={graphite.responseCountUrl} {...graphConf} />
            <Graph title="Response Times"
              getUrl={graphite.responseTimesUrl} {...graphConf} />
            <Graph title="Search Times"
              getUrl={graphite.searchTimesUrl} {...graphConf} />
            <Graph title="Redirects and Errors"
              getUrl={graphite.redirectsAndErrorsUrl} {...graphConf} />
            <Graph title="% of Auth'd Responses"
              getUrl={graphite.authResponseCountUrl} {...graphConf} />
          </div>
        </div>
      );
    }
  }
}


function select(state) {
  return {
    app: state.app,
  };
}


export default connect(select)(App);
