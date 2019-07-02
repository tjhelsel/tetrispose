import React, {Component} from 'react'
import {Grid, Segment} from 'semantic-ui-react'
import {connect} from 'react-redux'
import {
  Camera,
  PreviewShape,
  GameBoard,
  CurrentShape,
  UserShape,
  SuccessMessage
} from './components'

class GameHome extends Component {
  render() {
    const achieved = this.props.currentShape.achieved
    const isX = this.props.currentShape.shape.name === 'X'
    return (
      <Grid container columns={2} padded>
        <Grid.Column floated="left" width={10}>
          <Grid.Row>
            <Segment>
              <Camera />
            </Segment>
          </Grid.Row>
          {achieved || isX ? (
            <Segment color="orange" inverted>
              <SuccessMessage />
            </Segment>
          ) : (
            <Grid.Row>
              <Grid padded container>
                <Grid.Column width={8}>
                  <Segment color="orange" inverted>
                    <CurrentShape />
                  </Segment>
                </Grid.Column>
                <Grid.Column width={8}>
                  <Segment color="red" inverted>
                    <UserShape />
                  </Segment>
                </Grid.Column>
              </Grid>
            </Grid.Row>
          )}
          <Grid.Row>
            <Segment color="blue" inverted width={16}>
              <PreviewShape />
            </Segment>
          </Grid.Row>
        </Grid.Column>

        <Grid.Column floated="right" width={6}>
          <Segment color="green" inverted>
            <GameBoard />
          </Segment>
        </Grid.Column>
      </Grid>
    )
  }
}

const mapStateToProps = state => ({
  currentShape: state.currentShape
})

export default connect(mapStateToProps)(GameHome)
